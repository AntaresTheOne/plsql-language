import * as vscode from 'vscode';

import { PLSQLDefinitionProvider } from './provider/plsqlDefinition. provider';
import { PLSQLDocumentSymbolProvider } from './provider/plsqlDocumentSymbol. provider';
import { PLSQLCompletionItemProvider } from './provider/plsqlCompletionItem.provider';
import { PLSQLHoverProvider } from './provider/plsqlHover.provider';
import { PLSQLSignatureProvider } from './provider/plsqlSignature.provider';

import { PLSQLSettings } from './plsql.settings';

import { ConnectController }  from './connect/connect.controller';
import ConnectUIController  from './connect/connectUI.controller';
import { ConnectStatusBar } from './connect/connect.statusBar';
import { QueryController } from './query/query.controller';
import { OracleService } from './client-oracle/oracle.server';

export function activate(context: vscode.ExtensionContext) {

    // Get target languages from settings (supports Oracle SQL Developer Extension compatibility)
    const targetLanguages = PLSQLSettings.getTargetLanguages();
    
    // Create document selector for all target languages
    const languageSelector: vscode.DocumentSelector = targetLanguages.map(lang => ({ 
        language: lang, 
        scheme: 'file' 
    }));

    // Set language configuration for all target languages
    // Default without $# redefined here
    // because plsql.configuration.json don't work with getWordRangeAtPosition() according to issue #42649
    const wordPatternConfig: vscode. LanguageConfiguration = {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\%\^\&\*\(\)\-\=\+\[\{\]\}\|\;\:\'\"\,\.\<\>\/\?\s]+)/
    };
    
    targetLanguages.forEach(lang => {
        vscode.languages.setLanguageConfiguration(lang, wordPatternConfig);
    });

    let hoverProvider: PLSQLHoverProvider | undefined;
    let signatureHelpProvider: PLSQLSignatureProvider | undefined;

    // language providers
    activateHover();
    activateSignatureHelp();

    // Oracle connection
    activateOracleConnection();

    // Register providers for all target languages (plsql, oraclesql, sql, etc.)
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(languageSelector, new PLSQLCompletionItemProvider(), '.', '\"')
    );
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(languageSelector, new PLSQLDefinitionProvider())
    );

    // context.subscriptions.push(vscode.languages.registerReferenceProvider(languageSelector, new PLSQLReferenceProvider()));
    // context.subscriptions. push(vscode. languages.registerDocumentFormattingEditProvider(languageSelector, new PLSQLDocumentFormattingEditProvider()));
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(languageSelector, new PLSQLDocumentSymbolProvider())
    );
    // context.subscriptions. push(vscode. languages.registerWorkspaceSymbolProvider(new PLSQLWorkspaceSymbolProvider()));
    // context.subscriptions. push(vscode. languages.registerRenameProvider(languageSelector, new PLSQLRenameProvider()));
    // context.subscriptions. push(vscode. languages.registerCodeActionsProvider(languageSelector, new PLSQLCodeActionProvider()));

    // Connection
    const connectController = new ConnectController();
    const connectStatusBar = new ConnectStatusBar(connectController);
    const connectUIController = new ConnectUIController(context, connectController);
    context.subscriptions.push(vscode.commands.registerCommand('plsql.activateConnection',
            connectUIController.activateConnectionsList, connectUIController));

    // Query
    const queryController = new QueryController(context, connectController);
    context.subscriptions. push(vscode. commands.registerCommand('plsql.executeCommand',
        queryController.executeCommand, queryController));
    context.subscriptions.push(vscode.commands.registerCommand('plsql. createConnection',
        queryController.createConnection, queryController));
    context.subscriptions.push(vscode.commands.registerCommand('plsql. removeConnection',
        queryController.removeConnection, queryController));
    // context.subscriptions. push(vscode. commands.registerTextEditorCommand('plsql.runScript',
    //     queryController.runScript, queryController));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('plsql.runQuery',
        queryController.runQuery, queryController));

    vscode.workspace.onDidChangeConfiguration(configChangedEvent => {
        if (! configChangedEvent. affectsConfiguration('plsql-language'))
            return;

        connectController.configurationChanged();

        if (configChangedEvent.affectsConfiguration('plsql-language.signatureHelp'))
            activateSignatureHelp();
        if (configChangedEvent.affectsConfiguration('plsql-language.hover'))
            activateHover();
        if (configChangedEvent.affectsConfiguration('plsql-language.oracleConnection. enable'))
            activateOracleConnection();
    });

    function activateHover() {
        const enable = PLSQLSettings.getHoverEnable();

        if (! hoverProvider && enable) {
            hoverProvider = new PLSQLHoverProvider();
            // Register hover provider for all target languages
            context.subscriptions.push(
                vscode.languages.registerHoverProvider(languageSelector, hoverProvider)
            );
        }
        if (hoverProvider)
            hoverProvider.enable = enable;
    }

    function activateSignatureHelp() {
        const enable = PLSQLSettings.getSignatureEnable();

        if (!signatureHelpProvider && enable) {
            signatureHelpProvider = new PLSQLSignatureProvider();
            // Register signature help provider for all target languages
            context.subscriptions.push(
                vscode.languages.registerSignatureHelpProvider(languageSelector, signatureHelpProvider, '(', ',')
            );
        }
        if (signatureHelpProvider)
            signatureHelpProvider.enable = enable;
    }

    function activateOracleConnection() {
        const enable = PLSQLSettings.getOracleConnectionEnable();
        OracleService.activate(enable, context.asAbsolutePath(''));
    }
}

export function deactivate() {
    OracleService.activate(false, '', true);
}