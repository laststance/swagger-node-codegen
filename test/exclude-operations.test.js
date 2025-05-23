const path = require('path');
const fs = require('fs');
const assert = require('assert');
const rimraf = require('rimraf');
const codegen = require('../lib/codegen');
const { execSync } = require('child_process');

const outputDir = path.join(__dirname, 'output');

describe('Operation Exclusions', function() {
  this.timeout(10000);

  beforeEach(function() {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  });

  afterEach(function(done) {
    // Clean up output directory after tests
    rimraf(outputDir, done);
  });

  it('should exclude specified operationId from generation', function(done) {
    const swaggerFile = path.join(__dirname, 'fixtures/petstore.json');
    const operationToExclude = 'addPet'; // This will vary based on your test fixture
    
    codegen.generate({
      swagger: swaggerFile,
      target_dir: outputDir,
      template_dir: path.join(__dirname, '../templates/express-server'),
      excluded_operations: [operationToExclude]
    }).then(() => {
      // Check if files were generated for the non-excluded operations
      // This will depend on your template structure and the test swagger file
      const routesDir = path.join(outputDir, 'src/api/routes');
      fs.readdir(routesDir, (err, files) => {
        if (err) return done(err);
        
        // Check generated files to ensure they don't include the excluded operationId
        let foundExcludedOperation = false;
        
        // You need to adapt this based on your actual templates
        for (const file of files) {
          if (file.includes('pet')) {
            const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
            if (content.includes(operationToExclude)) {
              foundExcludedOperation = true;
              break;
            }
          }
        }
        
        assert.strictEqual(foundExcludedOperation, false, `Found excluded operation ${operationToExclude} in generated code`);
        done();
      });
    }).catch(done);
  });

  it('should handle multiple excluded operationIds', function(done) {
    const swaggerFile = path.join(__dirname, 'fixtures/petstore.json');
    const operationsToExclude = ['addPet', 'updatePet']; // Adjust based on test fixture
    
    codegen.generate({
      swagger: swaggerFile,
      target_dir: outputDir,
      template_dir: path.join(__dirname, '../templates/express-server'),
      excluded_operations: operationsToExclude
    }).then(() => {
      // Similar checks as above but for multiple operations
      const routesDir = path.join(outputDir, 'src/api/routes');
      fs.readdir(routesDir, (err, files) => {
        if (err) return done(err);
        
        let foundExcludedOperations = [];
        
        for (const file of files) {
          if (file.includes('pet')) {
            const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
            for (const op of operationsToExclude) {
              if (content.includes(op) && !foundExcludedOperations.includes(op)) {
                foundExcludedOperations.push(op);
              }
            }
          }
        }
        
        assert.strictEqual(foundExcludedOperations.length, 0, 
          `Found excluded operations: ${foundExcludedOperations.join(', ')}`);
        done();
      });
    }).catch(done);
  });
  
  it('should handle multiple operationIds with spaces in CLI format', function(done) {
    const swaggerFile = path.join(__dirname, 'fixtures/petstore.json');
    // Test the same format as the CLI would receive with spaces after commas
    const operationsToExclude = 'addPet, updatePet, deletePet'.split(',').map(item => item.trim()).filter(Boolean);
    
    codegen.generate({
      swagger: swaggerFile,
      target_dir: outputDir,
      template_dir: path.join(__dirname, '../templates/express-server'),
      excluded_operations: operationsToExclude
    }).then(() => {
      const routesDir = path.join(outputDir, 'src/api/routes');
      fs.readdir(routesDir, (err, files) => {
        if (err) return done(err);
        
        let foundExcludedOperations = [];
        
        for (const file of files) {
          if (file.includes('pet')) {
            const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
            for (const op of operationsToExclude) {
              if (content.includes(op) && !foundExcludedOperations.includes(op)) {
                foundExcludedOperations.push(op);
              }
            }
          }
        }
        
        assert.strictEqual(foundExcludedOperations.length, 0, 
          `Found excluded operations: ${foundExcludedOperations.join(', ')}`);
        done();
      });
    }).catch(done);
  });
  
  it('should properly handle multiple operationIds with CLI interface', function(done) {
    const swaggerFile = path.join(__dirname, 'fixtures/petstore.json');
    const cliPath = path.join(__dirname, '../cli.js');
    const cliOutputDir = path.join(outputDir, 'cli-test');
    
    // Create the output directory
    if (!fs.existsSync(cliOutputDir)) {
      fs.mkdirSync(cliOutputDir);
    }
    
    try {
      // Execute the CLI command with properly quoted exclude list
      execSync(`node ${cliPath} ${swaggerFile} -o ${cliOutputDir} -e "addPet,updatePet,deletePet"`, {
        stdio: 'pipe'
      });
      
      // Check if the generated files don't include excluded operations
      const routesDir = path.join(cliOutputDir, 'src/api/routes');
      const files = fs.readdirSync(routesDir);
      const excludedOps = ['addPet', 'updatePet', 'deletePet'];
      
      let foundExcludedOperations = [];
      
      for (const file of files) {
        if (file.includes('pet')) {
          const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
          for (const op of excludedOps) {
            if (content.includes(op) && !foundExcludedOperations.includes(op)) {
              foundExcludedOperations.push(op);
            }
          }
        }
      }
      
      assert.strictEqual(foundExcludedOperations.length, 0, 
        `Found excluded operations in CLI output: ${foundExcludedOperations.join(', ')}`);
      done();
    } catch (error) {
      done(error);
    }
  });
  
  it('should generate all operations when no exclusions are specified', function(done) {
    const swaggerFile = path.join(__dirname, 'fixtures/petstore.json');
    
    codegen.generate({
      swagger: swaggerFile,
      target_dir: outputDir,
      template_dir: path.join(__dirname, '../templates/express-server')
    }).then(() => {
      // Verify all expected operations are present
      const routesDir = path.join(outputDir, 'src/api/routes');
      fs.readdir(routesDir, (err, files) => {
        if (err) return done(err);
        
        // This test would need to be adapted based on your specific test fixture
        // and template outputs
        assert(files.length > 0, 'No files were generated');
        done();
      });
    }).catch(done);
  });

  // Add another test case with spaces after commas
  it('should handle multiple operationIds with spaces after commas in CLI', function(done) {
    const swaggerFile = path.join(__dirname, 'fixtures/petstore.json');
    const cliPath = path.join(__dirname, '../cli.js');
    const cliOutputDir = path.join(outputDir, 'cli-test-spaces');
    
    // Create the output directory
    if (!fs.existsSync(cliOutputDir)) {
      fs.mkdirSync(cliOutputDir);
    }
    
    try {
      // Execute the CLI command with spaces after commas, properly quoted
      execSync(`node ${cliPath} ${swaggerFile} -o ${cliOutputDir} -e "addPet, updatePet, deletePet"`, {
        stdio: 'pipe'
      });
      
      // Check if the generated files don't include excluded operations
      const routesDir = path.join(cliOutputDir, 'src/api/routes');
      const files = fs.readdirSync(routesDir);
      const excludedOps = ['addPet', 'updatePet', 'deletePet'];
      
      let foundExcludedOperations = [];
      
      for (const file of files) {
        if (file.includes('pet')) {
          const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
          for (const op of excludedOps) {
            if (content.includes(op) && !foundExcludedOperations.includes(op)) {
              foundExcludedOperations.push(op);
            }
          }
        }
      }
      
      assert.strictEqual(foundExcludedOperations.length, 0, 
        `Found excluded operations in CLI output with spaces: ${foundExcludedOperations.join(', ')}`);
      done();
    } catch (error) {
      done(error);
    }
  });
}); 