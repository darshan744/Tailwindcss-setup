import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('tailwindcss-setup', () => {
  let runner: SchematicTestRunner;
  let appTree: UnitTestTree
  beforeEach(() => {
    runner = new SchematicTestRunner('schematics', collectionPath);
    appTree = new UnitTestTree(Tree.empty())
    appTree.create("/package.json", JSON.stringify({
      name: "TestApp",
      version: "0.0.0",
      dependencies: {}
    }
    ))
    appTree.create("/src/styles.css", 'body : {margin : 0}')
  })
  it('works', async () => {
    const tree = await runner.runSchematic('tailwindcss-setup', {}, appTree);
    expect(tree.files).toEqual(["/package.json", "/.postcssrc.json", "/tailwind.config.js", "/src/styles.css"]);
  });
  it("should add tailwindcss postcss packages to package.json", async () => {
    const tree = await runner.runSchematic("tailwindcss-setup", {}, appTree)
    const packageJSONFile = JSON.parse(tree.readContent("/package.json"));

    expect(packageJSONFile.dependencies['tailwindcss']).toBe("^4.1.4")
    expect(packageJSONFile.dependencies['postcss']).toBe("^8.5.3")
  })
  it("should create tailwind.config.js and .postcssrc.json files", async () => {
    const tree = await runner.runSchematic("tailwindcss-setup", {}, appTree);

    expect(tree.files).toContain("/.postcssrc.json")
    expect(tree.files).toContain("/tailwind.config.js")

    const postcsscontent = tree.readContent("/.postcssrc.json");
    expect(postcsscontent).toContain(`"@tailwindcss/postcss"`)

    const configConent = tree.readContent("/tailwind.config.js");
    expect(configConent).toContain(
      './src/**/*.{html,ts}',
    )
  })
  it("should prepend @import in styles.css", async () => {
    const tree = await runner.runSchematic("tailwindcss-setup", {}, appTree);
    const styleContent = tree.readContent("/src/styles.css");
    expect(styleContent.startsWith(`@import "tailwindcss"`)).toBeTrue();
    expect(styleContent).toContain('body : {margin : 0}')
  })
  it("should create a task to install the tailwincss and postcss packages", async () => {
    await runner.runSchematic("tailwindcss-setup", {}, appTree);
    const task = runner.tasks.find(task => task.name === 'node-package')
    expect(task).toBeDefined()
  })

  it("should throw error coz no package.json found", async () => {
    appTree.delete("/package.json");
    await expectAsync(runner.runSchematic("tailwindcss-setup", {}, appTree)).toBeRejectedWithError(/No package\.json/);
  })
});
