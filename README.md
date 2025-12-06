## Compatibility with Oracle SQL Developer Extension

This extension is designed to work alongside the **Oracle SQL Developer Extension for VSCode** (`Oracle. sql-developer`).  Both extensions can be enabled simultaneously without conflicts.

### How it works

- **`. sql` files** are handled by Oracle SQL Developer Extension by default, preserving its compile buttons and other UI features
- **Other PL/SQL files** (`.pks`, `.pkb`, `.pls`, `.pck`, etc.) are handled by this extension
- **PL/SQL features** (Go to Definition, Document Symbols, Completion, Hover, Signature Help) work with files in `plsql`, `oraclesql`, and `sql` language modes

### Configuration

#### Use this extension for `. sql` files
If you prefer this extension to handle `.sql` files instead of Oracle SQL Developer, add to your settings:

```json
"files.associations": {
    "*.sql": "plsql"
}
```

#### Customize target languages
To change which language IDs this extension provides features for:

```json
"plsql-language.targetLanguages": ["plsql", "oraclesql", "sql"]
```

You can remove languages from this list if you don't want this extension to provide features for them.  For example, to only work with `plsql` files:

```json
"plsql-language.targetLanguages": ["plsql"]
```

### Troubleshooting

If you experience conflicts between extensions:

1. **Check the language mode** of your file (shown in the bottom-right corner of VS Code)
2. **Switch language mode** by clicking on it and selecting the desired language
3. **Use workspace settings** to configure different behaviors for different projects