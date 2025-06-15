import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'

// Package versions
const TAILWINDCSSVERSION = "^4.1.4";
const POSTCSSVERSION = "^8.5.3";
/**
 * @param _options the cli passed options (none for now);
 * @returns Rule of operations
 * @description Main (Entry) function for the schematic
 * */
export function tailwindcssSetup(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const tailwindconfigjscontent = `/** @type {import('tailwindcss').Config} */
  export default {
    content: [
      './src/**/*.{html,ts}',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
`
    const postcsscontent = `{
  "plugins": {
    "@tailwindcss/postcss": { }
  }
} `
    //adds dependency to the package.json
    addDependencies(tree);
    // creates .postcssrc.json file
    createConfigForTailwindcss(tree, ".postcssrc.json", postcsscontent);
    createConfigForTailwindcss(tree, "tailwind.config.js", tailwindconfigjscontent);
    // adds content to the css file only no support for scss or others
    addToCss(tree);
    // after specifiying in the package.json if we run this task
    // it installs the packages
    _context.addTask(new NodePackageInstallTask())
    return tree;
  };
}

/**
 * @param tree
 * @description adds packages to the package.json file
 * */
function addDependencies(tree: Tree): Tree {
  // find the package.json file content
  const packageJsonString = tree.read("package.json")?.toString("utf-8")
  // if nothing is found then its not in the project
  if (!packageJsonString) {
    throw new SchematicsException("No package.json Found.... Likely not a Angular workspace ")
  }
  // parses it
  const parsedJson: { dependencies: Record<string, string> } = JSON.parse(packageJsonString);
  // nothing is found create it
  if (!parsedJson.dependencies) {
    parsedJson.dependencies = {}
  }
  //add package and their function
  parsedJson.dependencies['tailwindcss'] = TAILWINDCSSVERSION;
  parsedJson.dependencies['postcss'] = POSTCSSVERSION;
  // override the packgae
  tree.overwrite('package.json', JSON.stringify(parsedJson, null, 2))
  return tree
}

/**
 * @param tree File tree
 * @description Adds file content to .postcssrc and tailwind.config
 * * */
function createConfigForTailwindcss(tree: Tree, filename: string, content: string): Tree {
  // create a .postcssrc.json file (for V4 only)
  if (!tree.exists(filename)) {
    tree.create(filename, content);
  }
  return tree;
}

/**
  * @param tree filetree
  * @description adds styles.css file contents
  * */
function addToCss(tree: Tree): Tree {
  // css file path
  const filePath = "src/styles.css";
  // content to addd
  const importContent = `@import "tailwindcss"`
  if (tree.exists(filePath)) {
    const content = tree.read(filePath)?.toString("utf-8");
    const finalContent = `${importContent}\n${content}`
    tree.overwrite(filePath, finalContent);
  }
  return tree;
}
