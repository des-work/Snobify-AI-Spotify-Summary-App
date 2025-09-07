import { logger } from '../observability/logger.js';
import { errorHandler } from '../errors/errorHandler.js';
import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, any>;
}

export class StartupValidator {
  private validationResults: ValidationResult[] = [];

  constructor() {
    console.log('Startup validator initialized');
  }

  async validateAll(): Promise<ValidationResult> {
    console.log('🔍 Starting comprehensive server validation...');
    
    const overallResult: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      // Run all validations in parallel for speed
      const [
        dependenciesResult,
        fileStructureResult,
        configResult,
        mlModulesResult,
        dataAccessResult
      ] = await Promise.all([
        this.validateDependencies(),
        this.validateFileStructure(),
        this.validateConfiguration(),
        this.validateMLModules(),
        this.validateDataAccess()
      ]);

      // Collect all results
      this.validationResults = [
        dependenciesResult,
        fileStructureResult,
        configResult,
        mlModulesResult,
        dataAccessResult
      ];

      // Aggregate results
      this.validationResults.forEach(result => {
        if (!result.success) {
          overallResult.success = false;
        }
        overallResult.errors.push(...result.errors);
        overallResult.warnings.push(...result.warnings);
        Object.assign(overallResult.details, result.details);
      });

      // Log results
      this.logValidationResults(overallResult);

      return overallResult;
    } catch (error) {
      const errorMessage = `Validation failed: ${error}`;
      logger.error({ error: errorMessage, stack: error.stack }, 'Startup validation failed');
      
      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        details: { validationError: error.message }
      };
    }
  }

  private async validateDependencies(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('📦 Validating dependencies...');
      
      const criticalDependencies = [
        'fastify',
        'csv-parse',
        'pino',
        'zod',
        'tsx'
      ];

      const optionalDependencies = [
        '@tensorflow/tfjs-node',
        'ml-matrix',
        'ml-kmeans',
        'ml-distance'
      ];

      const loadedDeps: string[] = [];
      const failedDeps: string[] = [];
      const optionalFailed: string[] = [];

      // Check critical dependencies
      for (const dep of criticalDependencies) {
        try {
          await import(dep);
          loadedDeps.push(dep);
        } catch (error) {
          failedDeps.push(dep);
          result.errors.push(`Critical dependency '${dep}' failed to load: ${error.message}`);
        }
      }

      // Check optional dependencies
      for (const dep of optionalDependencies) {
        try {
          await import(dep);
          loadedDeps.push(dep);
        } catch (error) {
          optionalFailed.push(dep);
          result.warnings.push(`Optional dependency '${dep}' not available: ${error.message}`);
        }
      }

      result.details = {
        loadedDependencies: loadedDeps,
        failedCritical: failedDeps,
        failedOptional: optionalFailed,
        totalLoaded: loadedDeps.length,
        totalCritical: criticalDependencies.length,
        totalOptional: optionalDependencies.length
      };

      if (failedDeps.length > 0) {
        result.success = false;
      }

      console.log(`✅ Dependencies: ${loadedDeps.length} loaded, ${failedDeps.length} critical failed, ${optionalFailed.length} optional failed`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Dependency validation failed: ${error.message}`);
    }

    return result;
  }

  private async validateFileStructure(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('📁 Validating file structure...');
      
      const projectRoot = path.resolve(process.cwd(), '..');
      const requiredPaths = [
        'app',
        'server',
        'Music data',
        'profiles',
        'scripts'
      ];

      const requiredFiles = [
        'app/package.json',
        'server/package.json',
        'snobify.config.json'
      ];

      const missingPaths: string[] = [];
      const missingFiles: string[] = [];
      const existingPaths: string[] = [];
      const existingFiles: string[] = [];

      // Check required directories
      for (const dir of requiredPaths) {
        const fullPath = path.join(projectRoot, dir);
        if (fs.existsSync(fullPath)) {
          existingPaths.push(dir);
        } else {
          missingPaths.push(dir);
          result.errors.push(`Required directory missing: ${dir}`);
        }
      }

      // Check required files
      for (const file of requiredFiles) {
        const fullPath = path.join(projectRoot, file);
        if (fs.existsSync(fullPath)) {
          existingFiles.push(file);
        } else {
          missingFiles.push(file);
          result.errors.push(`Required file missing: ${file}`);
        }
      }

      result.details = {
        existingPaths,
        missingPaths,
        existingFiles,
        missingFiles,
        projectRoot
      };

      if (missingPaths.length > 0 || missingFiles.length > 0) {
        result.success = false;
      }

      console.log(`✅ File structure: ${existingPaths.length}/${requiredPaths.length} directories, ${existingFiles.length}/${requiredFiles.length} files`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`File structure validation failed: ${error.message}`);
    }

    return result;
  }

  private async validateConfiguration(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('⚙️ Validating configuration...');
      
      const configPath = path.join(process.cwd(), '..', 'snobify.config.json');
      
      if (!fs.existsSync(configPath)) {
        result.errors.push('Configuration file not found');
        result.success = false;
        return result;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      let config: any;

      try {
        config = JSON.parse(configContent);
      } catch (error) {
        result.errors.push(`Invalid JSON in configuration file: ${error.message}`);
        result.success = false;
        return result;
      }

      // Validate required config fields
      const requiredFields = ['profilesDir', 'defaultProfile'];
      const missingFields: string[] = [];

      for (const field of requiredFields) {
        if (!(field in config)) {
          missingFields.push(field);
          result.errors.push(`Missing required configuration field: ${field}`);
        }
      }

      // Validate ML configuration
      if (config.ml) {
        if (typeof config.ml.enabled !== 'boolean') {
          result.warnings.push('ML enabled flag should be boolean');
        }
        
        if (config.ml.models) {
          const modelTypes = ['genre', 'mood', 'clustering', 'recommendations'];
          for (const modelType of modelTypes) {
            if (typeof config.ml.models[modelType] !== 'boolean') {
              result.warnings.push(`ML model '${modelType}' should be boolean`);
            }
          }
        }
      } else {
        result.warnings.push('ML configuration not found, using defaults');
      }

      result.details = {
        configExists: true,
        configValid: true,
        missingFields,
        mlEnabled: config.ml?.enabled || false,
        profilesDir: config.profilesDir,
        defaultProfile: config.defaultProfile
      };

      if (missingFields.length > 0) {
        result.success = false;
      }

      console.log(`✅ Configuration: ${missingFields.length === 0 ? 'valid' : 'invalid'}`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Configuration validation failed: ${error.message}`);
    }

    return result;
  }

  private async validateMLModules(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('🤖 Validating ML modules...');
      
      const mlModules = [
        { name: 'MoodPredictor', path: './ml/moodPredictor.js' },
        { name: 'GenreClassifier', path: './ml/genreClassifier.js' },
        { name: 'ArtistClusterer', path: './ml/artistClusterer.js' },
        { name: 'RecommendationEngine', path: './ml/recommendationEngine.js' },
        { name: 'MusicMLAnalyzer', path: './ml/analyzer.js' }
      ];

      const loadedModules: string[] = [];
      const failedModules: string[] = [];

      for (const module of mlModules) {
        try {
          const moduleExports = await import(module.path);
          if (moduleExports[module.name] || moduleExports.default) {
            loadedModules.push(module.name);
          } else {
            failedModules.push(module.name);
            result.errors.push(`ML module '${module.name}' loaded but class not found`);
          }
        } catch (error) {
          failedModules.push(module.name);
          result.errors.push(`ML module '${module.name}' failed to load: ${error.message}`);
        }
      }

      result.details = {
        loadedModules,
        failedModules,
        totalModules: mlModules.length,
        successRate: loadedModules.length / mlModules.length
      };

      if (failedModules.length > 0) {
        result.success = false;
      }

      console.log(`✅ ML modules: ${loadedModules.length}/${mlModules.length} loaded`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`ML modules validation failed: ${error.message}`);
    }

    return result;
  }

  private async validateDataAccess(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('📊 Validating data access...');
      
      const projectRoot = path.resolve(process.cwd(), '..');
      const dataPath = path.join(projectRoot, 'Music data');
      const profilesPath = path.join(projectRoot, 'profiles');

      let dataFilesCount = 0;
      let profileFilesCount = 0;
      let accessibleDataFiles: string[] = [];
      let inaccessibleDataFiles: string[] = [];

      // Check Music data directory
      if (fs.existsSync(dataPath)) {
        try {
          const dataFiles = fs.readdirSync(dataPath);
          dataFilesCount = dataFiles.length;
          
          // Test access to a few files
          for (const file of dataFiles.slice(0, 5)) {
            const filePath = path.join(dataPath, file);
            try {
              fs.accessSync(filePath, fs.constants.R_OK);
              accessibleDataFiles.push(file);
            } catch (error) {
              inaccessibleDataFiles.push(file);
            }
          }
        } catch (error) {
          result.errors.push(`Cannot read Music data directory: ${error.message}`);
        }
      } else {
        result.errors.push('Music data directory not found');
      }

      // Check profiles directory
      if (fs.existsSync(profilesPath)) {
        try {
          const profileFiles = fs.readdirSync(profilesPath);
          profileFilesCount = profileFiles.length;
        } catch (error) {
          result.errors.push(`Cannot read profiles directory: ${error.message}`);
        }
      } else {
        result.warnings.push('Profiles directory not found');
      }

      result.details = {
        dataPath,
        profilesPath,
        dataFilesCount,
        profileFilesCount,
        accessibleDataFiles: accessibleDataFiles.length,
        inaccessibleDataFiles: inaccessibleDataFiles.length
      };

      if (inaccessibleDataFiles.length > 0) {
        result.warnings.push(`${inaccessibleDataFiles.length} data files are not accessible`);
      }

      if (dataFilesCount === 0) {
        result.warnings.push('No data files found in Music data directory');
      }

      console.log(`✅ Data access: ${dataFilesCount} data files, ${profileFilesCount} profile files`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Data access validation failed: ${error.message}`);
    }

    return result;
  }

  private logValidationResults(result: ValidationResult): void {
    if (result.success) {
      logger.info({
        validation: 'success',
        errors: result.errors.length,
        warnings: result.warnings.length,
        details: result.details
      }, 'Server validation completed successfully');
    } else {
      logger.error({
        validation: 'failed',
        errors: result.errors,
        warnings: result.warnings,
        details: result.details
      }, 'Server validation failed');
    }

    // Log individual validation results
    this.validationResults.forEach((validationResult, index) => {
      const validationNames = [
        'Dependencies',
        'File Structure',
        'Configuration',
        'ML Modules',
        'Data Access'
      ];
      
      const name = validationNames[index] || `Validation ${index}`;
      
      if (validationResult.success) {
        logger.info({ validation: name, details: validationResult.details }, `${name} validation passed`);
      } else {
        logger.error({ 
          validation: name, 
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          details: validationResult.details 
        }, `${name} validation failed`);
      }
    });
  }

  public getValidationResults(): ValidationResult[] {
    return this.validationResults;
  }
}
