import * as devkit from '@nrwl/devkit';
import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { libraryGenerator } from './generator';
import { GeneratorOptions } from './schema';

describe('library generator', () => {
  let tree: Tree;
  const options: GeneratorOptions = { name: 'lib1' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  test('should add project configuration', async () => {
    await libraryGenerator(tree, options);

    const config = readProjectConfiguration(tree, options.name);
    expect(config).toMatchSnapshot();
  });

  test('should generate files', async () => {
    await libraryGenerator(tree, options);

    expect(tree.exists(`libs/${options.name}/src/index.js`)).toBeTruthy();
    expect(tree.exists(`libs/${options.name}/src/lib/Lib1.astro`)).toBeTruthy();
    expect(tree.exists(`libs/${options.name}/README.md`)).toBeTruthy();
    expect(tree.exists(`libs/${options.name}/tsconfig.json`)).toBeTruthy();
  });

  test('should add the path mapping', async () => {
    await libraryGenerator(tree, options);

    const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
    expect(compilerOptions.paths[`@proj/${options.name}`]).toStrictEqual([
      `libs/${options.name}/src/index.js`,
    ]);
  });

  test('should format files', async () => {
    jest.spyOn(devkit, 'formatFiles');

    await libraryGenerator(tree, options);

    expect(devkit.formatFiles).toHaveBeenCalled();
  });

  describe('--directory', () => {
    const directory = 'some-directory/sub-directory';

    test('should add project with the right name when a directory is provided', async () => {
      await libraryGenerator(tree, { ...options, directory });

      const project = readProjectConfiguration(
        tree,
        `some-directory-sub-directory-${options.name}`
      );
      expect(project).toBeTruthy();
    });

    test('should generate files in the right directory', async () => {
      await libraryGenerator(tree, { ...options, directory });

      expect(
        tree.exists(`libs/${directory}/${options.name}/src/index.js`)
      ).toBeTruthy();
      expect(
        tree.exists(`libs/${directory}/${options.name}/src/lib/Lib1.astro`)
      ).toBeTruthy();
      expect(
        tree.exists(`libs/${directory}/${options.name}/README.md`)
      ).toBeTruthy();
      expect(
        tree.exists(`libs/${directory}/${options.name}/tsconfig.json`)
      ).toBeTruthy();
    });

    test('should add the path mapping with the right directory', async () => {
      await libraryGenerator(tree, { ...options, directory });

      const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
      expect(
        compilerOptions.paths[
          `@proj/some-directory-sub-directory-${options.name}`
        ]
      ).toStrictEqual([`libs/${directory}/${options.name}/src/index.js`]);
    });
  });

  describe('--tags', () => {
    test('should add project tags when provided', async () => {
      await libraryGenerator(tree, { ...options, tags: 'foo, bar' });

      const { tags } = readProjectConfiguration(tree, options.name);
      expect(tags).toEqual(['foo', 'bar']);
    });
  });

  describe('--publishable', () => {
    test('should not generate a package.json when publishable is false', async () => {
      await libraryGenerator(tree, { ...options, publishable: false });

      expect(tree.exists(`libs/${options.name}/package.json`)).toBeFalsy();
    });

    test('should throw when publishable is true and importPath was not specified', async () => {
      await expect(
        libraryGenerator(tree, { ...options, publishable: true })
      ).rejects.toThrow();
    });

    test('should generate a package.json when publishable is true', async () => {
      await libraryGenerator(tree, {
        ...options,
        publishable: true,
        importPath: 'lib1',
      });

      expect(tree.exists(`libs/${options.name}/package.json`)).toBeTruthy();
    });
  });

  describe('--importPath', () => {
    const importPath = '@my-awesome-scope/lib1';

    test('should use the specified importPath as the package name', async () => {
      await libraryGenerator(tree, {
        ...options,
        importPath,
        publishable: true,
      });

      expect(readJson(tree, `libs/${options.name}/package.json`).name).toBe(
        importPath
      );
    });

    test('should add the specified importPath to the path mappings in tsconfig.base.json', async () => {
      await libraryGenerator(tree, { ...options, importPath });

      const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
      expect(compilerOptions.paths[importPath]).toStrictEqual([
        `libs/${options.name}/src/index.js`,
      ]);
    });
  });

  describe('--standaloneConfig', () => {
    test('should create a project.json when standaloneConfig is true', async () => {
      await libraryGenerator(tree, { ...options, standaloneConfig: true });

      expect(tree.exists(`libs/${options.name}/project.json`)).toBeTruthy();
    });

    test('should not create a project.json when standaloneConfig is false', async () => {
      await libraryGenerator(tree, { ...options, standaloneConfig: false });

      expect(tree.exists(`libs/${options.name}/project.json`)).toBeFalsy();
      const project = readProjectConfiguration(tree, options.name);
      expect(project).toBeTruthy();
    });
  });
});
