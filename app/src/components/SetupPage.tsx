import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ProfileInfo {
  name: string;
  hasData: boolean;
  dataType: string | null;
  dataPath: string | null;
}

interface ProfilesResponse {
  profiles: ProfileInfo[];
  defaultProfile: string;
  hasMusicData: boolean;
  musicDataPath: string | null;
  profilesDir: string;
}

interface SetupPageProps {
  currentProfile: string;
  onAnalyze: (profile: string) => void;
  onBack: () => void;
}

// ─── Folder traversal (DataTransferItem / FileSystem API) ─────────────────────

async function collectFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise(resolve => {
      (entry as FileSystemFileEntry).file(
        f => resolve(f.name.toLowerCase().endsWith('.csv') ? [f] : []),
        () => resolve([]),
      );
    });
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const allEntries: FileSystemEntry[] = [];

    // readEntries() returns at most 100 items at a time — loop until empty
    await new Promise<void>(resolve => {
      const readBatch = () =>
        reader.readEntries(
          batch => { if (!batch.length) { resolve(); return; } allEntries.push(...batch); readBatch(); },
          () => resolve(),
        );
      readBatch();
    });

    const nested = await Promise.all(allEntries.map(collectFilesFromEntry));
    return nested.flat();
  }

  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SetupPage({ currentProfile, onAnalyze, onBack }: SetupPageProps) {
  const [profilesData, setProfilesData]   = useState<ProfilesResponse | null>(null);
  const [selectedProfile, setSelectedProfile] = useState(currentProfile);
  const [customProfile, setCustomProfile] = useState('');
  const [useCustom, setUseCustom]         = useState(false);
  const [serverOnline, setServerOnline]   = useState<boolean | null>(null);
  const [loading, setLoading]             = useState(true);

  // Upload state
  const [uploadFiles, setUploadFiles]   = useState<File[]>([]);
  const [uploading, setUploading]       = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [folderScanning, setFolderScanning] = useState(false);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = useCustom ? customProfile.trim() || 'default' : selectedProfile;

  // ── Profiles fetch ────────────────────────────────────────────────────────
  const fetchProfiles = useCallback(() => {
    setLoading(true);
    fetch('/api/profiles')
      .then(r => r.json())
      .then((data: ProfilesResponse) => {
        setProfilesData(data);
        setServerOnline(true);
        if (!useCustom) {
          const match = data.profiles.find(p => p.name === currentProfile);
          if (match) setSelectedProfile(currentProfile);
          else if (data.profiles.length > 0) setSelectedProfile(data.profiles[0].name);
        }
        setLoading(false);
      })
      .catch(() => { setServerOnline(false); setLoading(false); });
  }, [currentProfile, useCustom]);

  useEffect(() => { fetchProfiles(); }, []);

  // ── File queueing ─────────────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const csvs = Array.from(files).filter(f =>
      f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv'
    );
    if (csvs.length === 0) {
      setUploadResult({ ok: false, message: 'No .csv files found in the selection.' });
      return;
    }
    setUploadFiles(prev => {
      // deduplicate by name (webkitRelativePath when available, else name)
      const existing = new Set(prev.map(f => (f as any).webkitRelativePath || f.name));
      return [...prev, ...csvs.filter(f => !existing.has((f as any).webkitRelativePath || f.name))];
    });
    setUploadResult(null);
  }, []);

  const removeFile = (key: string) => {
    setUploadFiles(prev => prev.filter(f => ((f as any).webkitRelativePath || f.name) !== key));
    setUploadResult(null);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    for (const file of uploadFiles) {
      // Use webkitRelativePath when present to avoid name collisions across sub-folders
      const relativePath = (file as any).webkitRelativePath as string | undefined;
      const safeName = relativePath
        ? relativePath.replace(/[/\\]/g, '_')
        : file.name;
      formData.append('files', file, safeName);
    }

    try {
      const resp = await fetch(`/api/upload?profile=${encodeURIComponent(activeProfile)}`, {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (resp.ok) {
        const totalKB = Math.round(data.files.reduce((s: number, f: any) => s + f.size, 0) / 1024);
        setUploadResult({
          ok: true,
          message: `Uploaded ${data.uploaded} file${data.uploaded > 1 ? 's' : ''} (${totalKB} KB) to profile "${data.profile}".`,
        });
        setUploadFiles([]);
        fetchProfiles();
      } else {
        setUploadResult({ ok: false, message: data?.error?.message || data.error || 'Upload failed.' });
      }
    } catch (err: any) {
      setUploadResult({ ok: false, message: `Upload error: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  // ── Drag and drop — folder-aware ──────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    // Prefer the DataTransferItem API — it exposes directory entries
    const items = Array.from(e.dataTransfer.items);
    if (items.length && typeof items[0].webkitGetAsEntry === 'function') {
      setFolderScanning(true);
      try {
        const entries = items
          .map(item => item.webkitGetAsEntry())
          .filter((entry): entry is FileSystemEntry => entry !== null);

        const fileArrays = await Promise.all(entries.map(collectFilesFromEntry));
        const files = fileArrays.flat();
        if (files.length) { addFiles(files); return; }
      } finally {
        setFolderScanning(false);
      }
    }

    // Fallback for browsers without DataTransferItem support
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // ── Folder input handler ──────────────────────────────────────────────────
  const onFolderSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const canAnalyze      = activeProfile.length > 0 && serverOnline === true;
  const selectedInfo    = profilesData?.profiles.find(p => p.name === activeProfile);
  const hasExistingData = selectedInfo?.hasData || false;
  const readyToAnalyze  = canAnalyze && (hasExistingData || uploadResult?.ok);

  const fileCount = uploadFiles.length;
  const showCompact = fileCount > 8;   // compact list for large batches

  return (
    <div className="container fade-in-up" style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎵</div>
        <h1 style={{
          fontSize: '2rem', fontWeight: 800, margin: '0 0 8px',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Set Up Your Analysis
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Upload your Spotify data, pick a profile, and let The Snob loose.
        </p>
      </div>

      {/* Server status banner */}
      {serverOnline === false && (
        <div style={{
          padding: '14px 20px', marginBottom: 20, borderRadius: 14,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--error)' }}>Server not running</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Run <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>npm start</code> in
              the Snobify project root to start both the server and frontend.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={fetchProfiles} style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.85rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="title" style={{ fontSize: 18 }}>Step 1 — Upload Your Spotify Data</div>
        <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>
          Export your listening history from Spotify (Settings &gt; Privacy &gt; Download your data),
          then drop your CSV files or an entire playlist folder below.
        </p>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
        {/* webkitdirectory lets the browser open a folder picker */}
        <input
          ref={folderInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          style={{ display: 'none' }}
          onChange={onFolderSelected}
          {...({ webkitdirectory: '' } as any)}
        />

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: fileCount > 0 ? '16px' : '32px 20px',
            textAlign: 'center',
            background: dragOver ? 'rgba(59,130,246,0.06)' : 'rgba(0,0,0,0.015)',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {folderScanning && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8, zIndex: 10,
            }}>
              <div style={{ fontSize: '2rem' }}>📂</div>
              <div style={{ color: 'white', fontWeight: 600 }}>Scanning folder…</div>
            </div>
          )}

          {fileCount === 0 ? (
            /* Empty state */
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📂</div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
                Drop CSV files or a whole folder here
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 18 }}>
                Works with individual files, multiple files, or your entire Spotify playlists folder
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.35)',
                    color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                >
                  📄 Select Files
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)',
                    color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                >
                  📁 Select Folder
                </button>
              </div>
            </div>
          ) : showCompact ? (
            /* Compact view for large batches */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>📂</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fileCount} CSV files queued</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {(uploadFiles.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1)} MB total
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setUploadFiles([]); setUploadResult(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontWeight: 700, fontSize: '0.9rem', padding: '4px 8px' }}
                >
                  Clear all
                </button>
              </div>

              {/* Sample of first few files */}
              <div style={{ textAlign: 'left', maxHeight: 140, overflowY: 'auto', marginBottom: 10 }}>
                {uploadFiles.slice(0, 5).map(f => {
                  const key = (f as any).webkitRelativePath || f.name;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.05)', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.85rem' }}>📄</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', flexShrink: 0 }}>{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  );
                })}
                {fileCount > 5 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', padding: '4px 8px' }}>
                    + {fileCount - 5} more files…
                  </div>
                )}
              </div>

              {/* Add more */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.82rem', padding: '5px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                  + Add Files
                </button>
                <button onClick={() => folderInputRef.current?.click()} style={{ fontSize: '0.82rem', padding: '5px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
                  + Add Folder
                </button>
              </div>
            </div>
          ) : (
            /* Full list view for small batches */
            <div style={{ textAlign: 'left' }}>
              {uploadFiles.map(f => {
                const key = (f as any).webkitRelativePath || f.name;
                const displayName = (f as any).webkitRelativePath || f.name;
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', marginBottom: 6, borderRadius: 10,
                    background: 'rgba(59,130,246,0.06)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span>📄</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem', flexShrink: 0 }}>
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(key)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '1rem', padding: '2px 6px', flexShrink: 0 }}
                      title="Remove file"
                    >✕</button>
                  </div>
                );
              })}
              <div style={{ textAlign: 'center', marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ fontSize: '0.82rem', padding: '5px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                  + Add Files
                </button>
                <button onClick={e => { e.stopPropagation(); folderInputRef.current?.click(); }} style={{ fontSize: '0.82rem', padding: '5px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
                  + Add Folder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload button */}
        {fileCount > 0 && (
          <button
            className="btn"
            onClick={handleUpload}
            disabled={uploading || serverOnline === false}
            style={{ marginTop: 14, width: '100%', opacity: uploading ? 0.6 : 1, cursor: uploading ? 'wait' : 'pointer' }}
          >
            {uploading
              ? `Uploading ${fileCount} file${fileCount > 1 ? 's' : ''}…`
              : `Upload ${fileCount} file${fileCount > 1 ? 's' : ''} to "${activeProfile}"`}
          </button>
        )}

        {/* Upload result */}
        {uploadResult && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 10,
            background: uploadResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${uploadResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: uploadResult.ok ? 'var(--success)' : 'var(--error)',
            fontWeight: 600, fontSize: '0.9rem',
          }}>
            {uploadResult.ok ? '✓' : '✕'} {uploadResult.message}
          </div>
        )}
      </div>

      {/* ── Step 2: Profile ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="title" style={{ fontSize: 18 }}>Step 2 — Choose a Profile</div>

        {loading && <p style={{ color: 'var(--muted)' }}>Loading profiles…</p>}

        {!loading && serverOnline && profilesData && (
          <>
            {profilesData.profiles.length > 0 && !useCustom && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {profilesData.profiles.map(p => (
                  <label key={p.name} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${selectedProfile === p.name ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedProfile === p.name ? 'rgba(59,130,246,0.06)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}>
                    <input
                      type="radio" name="profile" value={p.name}
                      checked={selectedProfile === p.name}
                      onChange={() => setSelectedProfile(p.name)}
                      style={{ accentColor: 'var(--accent)', width: 18, height: 18 }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      {p.name === profilesData.defaultProfile && (
                        <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: 'var(--gradient-primary)', color: 'white' }}>default</span>
                      )}
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 2 }}>
                        {p.hasData ? `✓ Data ready (${p.dataPath})` : '⚠ No data — upload files above'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                type="checkbox" id="useCustom" checked={useCustom}
                onChange={e => setUseCustom(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <label htmlFor="useCustom" style={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                Create a new profile
              </label>
            </div>
            {useCustom && (
              <input
                type="text" value={customProfile}
                onChange={e => setCustomProfile(e.target.value)}
                placeholder="e.g. work, party, throwback"
                style={{
                  marginTop: 10, width: '100%', padding: '10px 14px',
                  borderRadius: 10, border: '2px solid var(--border)',
                  fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                autoFocus
              />
            )}
          </>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn"
          disabled={!readyToAnalyze}
          onClick={() => readyToAnalyze && onAnalyze(activeProfile)}
          style={{ fontSize: '1rem', padding: '14px 32px', opacity: readyToAnalyze ? 1 : 0.4, cursor: readyToAnalyze ? 'pointer' : 'not-allowed' }}
        >
          {!serverOnline ? 'Server Offline' : !hasExistingData && !uploadResult?.ok ? 'Upload Data First' : 'Analyze My Music 🎧'}
        </button>
      </div>
    </div>
  );
}
