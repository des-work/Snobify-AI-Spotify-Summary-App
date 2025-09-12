// ============================================================================
// STARTUP VALIDATOR - Simple Implementation
// ============================================================================

export class StartupValidator {
  private validationResults: any = {};

  constructor() {
    console.log('StartupValidator initialized');
  }

  async validateAll(): Promise<any> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    try {
      // Check if we can read the config
      const fs = await import('fs');
      const path = await import('path');
      const root = path.resolve(process.cwd(), '..');
      const cfgPath = path.join(root, 'snobify.config.json');
      
      if (!fs.existsSync(cfgPath)) {
        warnings.push('Configuration file not found, will create default');
      }

      // Check if profiles directory exists
      const profilesDir = path.join(root, 'profiles');
      if (!fs.existsSync(profilesDir)) {
        warnings.push('Profiles directory not found, will create default');
      }

      // Check if Music data directory exists
      const musicDataDir = path.join(root, 'Music data');
      if (!fs.existsSync(musicDataDir)) {
        warnings.push('Music data directory not found');
      }
      
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.validationResults = {
      success: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };

    return this.validationResults;
  }

  getValidationResults(): any {
    return this.validationResults;
  }
}