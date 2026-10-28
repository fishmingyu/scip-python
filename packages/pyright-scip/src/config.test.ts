import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createFromRealFileSystem } from 'pyright-internal/common/realFileSystem';
import { PyrightFileSystem } from 'pyright-internal/pyrightFileSystem';
import { ScipPyrightConfig } from './config';
import { ScipConfig } from './lib';

let originalDirectory: string;
let projectDirectory: string;

beforeEach(() => {
    originalDirectory = process.cwd();
    projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'scip-library-policy-'));
    process.chdir(projectDirectory);
});

afterEach(() => {
    process.chdir(originalDirectory);
    fs.rmSync(projectDirectory, { recursive: true, force: true });
});

function effectiveConfig(): ScipPyrightConfig {
    return new ScipPyrightConfig(
        { projectRoot: projectDirectory } as ScipConfig,
        new PyrightFileSystem(createFromRealFileSystem())
    );
}

test.each(['scip-pyrightconfig.json', 'pyrightconfig.json', 'pyproject.toml'])(
    'preserves the project library-type policy in %s',
    (filename) => {
        for (const enabled of [false, true]) {
            const contents = filename.endsWith('.toml')
                ? `[tool.pyright]\nuseLibraryCodeForTypes = ${enabled}\n`
                : JSON.stringify({ useLibraryCodeForTypes: enabled });
            fs.writeFileSync(path.join(projectDirectory, filename), contents);

            expect(effectiveConfig().getConfigOptions().useLibraryCodeForTypes).toBe(enabled);
        }
    }
);

test('keeps library-code type analysis enabled when the project has no setting', () => {
    expect(effectiveConfig().getConfigOptions().useLibraryCodeForTypes).toBe(true);
});
