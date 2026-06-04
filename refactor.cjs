const fs = require('fs');
const path = require('path');

const stores = {
  transactions: "useTransactionStore",
  addTransaction: "useTransactionStore",
  updateTransaction: "useTransactionStore",
  deleteTransaction: "useTransactionStore",
  duplicateTransaction: "useTransactionStore",
  
  categories: "useCategoryStore",
  addCategory: "useCategoryStore",
  deleteCategory: "useCategoryStore",

  budgetConfig: "useBudgetStore",
  updateBudgetConfig: "useBudgetStore",

  goals: "useGoalStore",
  addGoal: "useGoalStore",
  updateGoal: "useGoalStore",
  deleteGoal: "useGoalStore",
  contributeToGoal: "useGoalStore",

  settings: "useSettingsStore",
  setTheme: "useSettingsStore",
  setPasswordEnabled: "useSettingsStore",
  unlock: "useSettingsStore",
  lock: "useSettingsStore",
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // If useFinanceStore is not imported, skip
  if (!content.includes('useFinanceStore')) return;

  // We need to figure out which stores this file actually uses.
  const usedStores = new Set();
  
  Object.keys(stores).forEach(key => {
    // Check if the property is selected, e.g. useFinanceStore(s => s.transactions)
    const regex = new RegExp(`useFinanceStore\\(\\s*\\(\\s*[a-zA-Z]+\\s*\\)\\s*=>\\s*[a-zA-Z]+\\.${key}\\s*\\)`);
    const regex2 = new RegExp(`useFinanceStore\\(\\s*[a-zA-Z]+\\s*=>\\s*[a-zA-Z]+\\.${key}\\s*\\)`);
    // Also check for nested like s.settings.isLocked
    const regex3 = new RegExp(`useFinanceStore\\(\\s*\\(\\s*[a-zA-Z]+\\s*\\)\\s*=>\\s*[a-zA-Z]+\\.settings\\.${key}\\s*\\)`);
    
    if (regex.test(content) || regex2.test(content) || regex3.test(content) || content.includes(`.${key}`)) {
        usedStores.add(stores[key]);
    }
    // Also replace the call: useFinanceStore(s => s.x) -> useXStore(s => s.x)
    content = content.replace(new RegExp(`useFinanceStore\\(\\s*\\(\\s*([a-zA-Z]+)\\s*\\)\\s*=>\\s*\\1\\.${key}\\s*\\)`, 'g'), `${stores[key]}((s) => s.${key})`);
    content = content.replace(new RegExp(`useFinanceStore\\(\\s*([a-zA-Z]+)\\s*=>\\s*\\1\\.${key}\\s*\\)`, 'g'), `${stores[key]}((s) => s.${key})`);
  });

  // Handle settings specifically for nested props like settings.theme
  content = content.replace(/useFinanceStore\(\s*\(\s*([a-zA-Z]+)\s*\)\s*=>\s*\1\.settings\.([a-zA-Z]+)\s*\)/g, `useSettingsStore((s) => s.settings.$2)`);
  content = content.replace(/useFinanceStore\(\s*([a-zA-Z]+)\s*=>\s*\1\.settings\.([a-zA-Z]+)\s*\)/g, `useSettingsStore((s) => s.settings.$2)`);

  // Build the new import statements
  let importStatements = [];
  usedStores.forEach(store => {
    importStatements.push(`import ${store} from "@/stores/${store}";`);
  });

  // Replace the old import
  content = content.replace(/import\s+useFinanceStore\s+from\s+["']@\/stores\/useFinanceStore["'];?/g, importStatements.join('\n'));
  content = content.replace(/import\s+useFinanceStore\s+from\s+["']\.\.\/stores\/useFinanceStore["'];?/g, importStatements.join('\n').replace(/@\/stores/g, '../stores'));
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  });
}

walkDir(path.join(__dirname, 'src'));
console.log('Refactoring complete.');
