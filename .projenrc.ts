import { JsonPatch, TextFile, typescript } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';

const NODE_VERSION = '16.15.0';

const project = new typescript.TypeScriptProject({
   packageName: '@silvermine/toolbox',
   description:
      'A library of common TypeScript types, custom type guards, and utility functions.',
   name: 'toolbox-projen',
   defaultReleaseBranch: 'master',
   packageManager: NodePackageManager.NPM,
   projenrcTs: true,
   minNodeVersion: NODE_VERSION,
   maxNodeVersion: NODE_VERSION,
   mergify: false,
   prettier: true,
   prettierOptions: {
      settings: {
         singleQuote: true,
         semi: true,
         tabWidth: 3,
      },
   },
   jest: false,
   depsUpgrade: false,
});

/**
 * Dependencies need to be overridden after the initial constructor initialization:
 * https://projen.io/deps.html#overriding-dependency-specifications
 */
const devDependencies = [
   '@silvermine/chai-strictly-equal@1.1.0',
   '@silvermine/eslint-config@git+https://github.com/silvermine/eslint-config-silvermine#fa9925f9de6b8139d42781dbd002b4024318744a',
   '@silvermine/eslint-plugin-silvermine@2.4.0',
   '@silvermine/standardization@2.0.0',
   '@silvermine/typescript-config@git+https://github.com/silvermine/typescript-config#23213e33077089e723629dead5342abe6f3b3c8c',
   '@types/chai@4.1.7',
   '@types/mocha@5.2.5',
   '@types/node@12.20.45',
   '@types/sinon@5.0.5',
   '@typescript-eslint/eslint-plugin@5.17.0',
   '@typescript-eslint/parser@5.17.0',
   'chai@4.2.0',
   'check-node-version@4.0.2',
   'coveralls@3.0.9',
   'eslint@8.16.0',
   'mocha@5.2.0',
   'nyc@13.1.0',
   'sinon@5.1.1',
   'source-map-support@0.5.16',
   'ts-node@7.0.1',
   'tslib@1.9.3',
   'typescript@3.9.5',
];

devDependencies.forEach((dependency) => {
   project.addDevDeps(dependency);
});

/**
 * Remove some default github actions configs
 */
project.tryRemoveFile('.github/workflows/upgrade-master.yml');
project.tryRemoveFile('.github/workflows/release.yml');

/**
 * Patches for default github actions commands
 */
const githubBuildWorkflow = project.tryFindObjectFile(
   '.github/workflows/build.yml',
);
githubBuildWorkflow?.patch(JsonPatch.add('/on/push', {}));
githubBuildWorkflow?.patch(
   JsonPatch.replace('/jobs/build/steps/3/run', 'npm run build'),
);
githubBuildWorkflow?.patch(
   JsonPatch.add('/jobs/build/steps/3', {
      name: 'standards',
      run: 'npm run standards',
   }),
);
githubBuildWorkflow?.patch(
   JsonPatch.add('/jobs/build/steps/4', {
      name: 'test',
      run: 'npm test',
   }),
);

project.addGitIgnore('!/package-lock.json');

project.tryRemoveFile('.eslintrc.json');

new TextFile(project, '.eslintrc.json', {
   lines: [
      '{',
      '   "root": true,',
      '   "extends": "@silvermine/eslint-config/node",',
      '   "ignorePatterns": [ "lib/**/*" ]',
      '}',
   ],
});

project.addScripts({
   // 'prepare': 'npx projen build',
   build: 'npm run build:commonjs && npm run build:esm && npm run build:types && npm run build:standards',
   'build:commonjs': 'tsc -p src/tsconfig.commonjs.json --pretty',
   'build:esm': 'tsc -p src/tsconfig.esm.json --pretty',
   'build:types': 'tsc -p src/tsconfig.types.json --pretty',
   'build:standards': 'tsc -p tsconfig.json --pretty',
   'test:node-version': 'check-node-version --npm 8.5.5 --print',
   test: "npm run test:node-version && TS_NODE_PROJECT='test/tsconfig.json' TS_NODE_FILES=true nyc mocha --opts ./.mocha.opts",
   eslint: "eslint '{,!(node_modules|dist)/**/}*.{js,ts}'",
   markdownlint:
      "markdownlint -c .markdownlint.json -i CHANGELOG.md '{,!(node_modules)/**/}*.md'",
   commitlint: 'commitlint --from 3032e3c',
   standards: 'npm run markdownlint && npm run eslint',
   'release:preview':
      'node ./node_modules/@silvermine/standardization/scripts/release.js preview',
   'release:prep-changelog':
      'node ./node_modules/@silvermine/standardization/scripts/release.js prep-changelog',
   'release:finalize':
      'node ./node_modules/@silvermine/standardization/scripts/release.js finalize',
});

new TextFile(project, '.mocha.opts', {
   lines: [
      '--require source-map-support/register',
      '--require ./test/setup/before.ts',
      '--full-trace',
      '--bail',
      'test/**/*.test.ts',
   ],
});

new TextFile(project, '.nycrc.json', {
   lines: [
      '{',
      '   "include": [',
      '      "src/**/*.{ts,js}"',
      '   ],',
      '   "exclude": [',
      '      "**/*.d.ts"',
      '   ],',
      '   "extension": [',
      '      ".ts",',
      '      ".js"',
      '   ],',
      '   "require": [',
      '      "ts-node/register"',
      '   ],',
      '   "reporter": [',
      '      "text-summary",',
      '      "html",',
      '      "lcov"',
      '   ],',
      '   "sourceMap": true,',
      '   "all": true',
      '}',
   ],
});

new TextFile(project, 'test/tsconfig.json', {
   lines: [
      '{',
      '   "extends": "@silvermine/typescript-config/tsconfig.json"',
      '}',
   ],
});

new TextFile(project, '.nvmrc', {
   lines: [NODE_VERSION],
});

new TextFile(project, '.markdownlint.json', {
   lines: [
      '{',
      '   "extends": "./node_modules/@silvermine/standardization/.markdownlint.json"',
      '}',
   ],
});

new TextFile(project, 'src/tsconfig.commonjs.json', {
   lines: [
      '{',
      '   "extends": "@silvermine/typescript-config/tsconfig.commonjs.json",',
      '   "compilerOptions": {',
      '      "outDir": "../dist/commonjs/"',
      '   }',
      '}',
   ],
});

new TextFile(project, 'src/tsconfig.esm.json', {
   lines: [
      '{',
      '   "extends": "@silvermine/typescript-config/tsconfig.esm.json",',
      '   "compilerOptions": {',
      '      "outDir": "../dist/esm/"',
      '   }',
      '}',
   ],
});

new TextFile(project, 'src/tsconfig.types.json', {
   lines: [
      '{',
      '   "extends": "@silvermine/typescript-config/tsconfig.types.json",',
      '   "compilerOptions": {',
      '      "outDir": "../dist/types/"',
      '   }',
      '}',
   ],
});

project.synth();
