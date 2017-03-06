const vscode = require('vscode');

function activate(context) {

    const gremlist = [{
        name: "zero-width space",
        charpoint: 0x200b,
        decorstyle: {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'red'
        },
        // properties below will be set later
        vsdecorstyle: null, // merged with base
        decors: [], // "instances"
        charpointstring: null // for hint
    }, {
        name: "non-breaking space",
        charpoint: 0x00a0
    }, {
        name: "zero width no-break space, BOM",
        charpoint: 0xfeff,
        decorstyle: {
            borderWidth: '3px',
            borderStyle: 'solid'
        }
    }, {
        name: 'word joiner',
        charpoint: 0x2060,
        decorstyle: {
            borderWidth: '3px',
            borderStyle: 'solid'
        }
    }];

    const basicdecorstyle = {
        borderWidth: '1px',
        borderStyle: 'none',
        borderColor: 'red',
        backgroundColor: 'rgba(255,128,128,.5)',
        overviewRulerColor: 'darkred',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
        },
        dark: {
            gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
        },
        gutterIconSize: 'contain'
    };

    gremlist.forEach((gremitem) => {
        let style = Object.assign({}, basicdecorstyle, gremitem.decorstyle);
        gremitem.charpointstring = 'U+'+gremitem.charpoint.toString(16).replace(/.*/,m=>m.length<4?'0'.repeat(4-m.length)+m:m);
        gremitem.vsdecorstyle = vscode.window.createTextEditorDecorationType(style);
        gremitem.regexp = RegExp(String.fromCodePoint(gremitem.charpoint) + '+', 'g')
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) {
            return;
        }
        updateDecorations(editor);
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection(event => {
        if (!event.textEditor) {
            return;
        }
        updateDecorations(event.textEditor);
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        updateDecorations(vscode.window.activeTextEditor);
    }, null, context.subscriptions);

    function updateDecorations(activeTextEditor) {
        if (!activeTextEditor) {
            return;
        }

        const doc = activeTextEditor.document;

        gremlist.forEach((gremitem) => {
            gremitem.decorations = []
        });

        for (let i = 0; i < doc.lineCount; i++) {
            let line = doc.lineAt(i);
            let lineText = line.text;
            let match;
            gremlist.forEach((gremitem) => {
                while (match = gremitem.regexp.exec(lineText)) {
                    let startPos = new vscode.Position(i, match.index);
                    let endPos = new vscode.Position(i, match.index + match[0].length);
                    const decoration = {
                        range: new vscode.Range(startPos, endPos),
                        hoverMessage: match[0].length + " " + gremitem.name + (match[0].length > 1 ? "s" : "") + 
                        " (unicode " + gremitem.charpointstring + ") here"
                    };
                    gremitem.decorations.push(decoration);
                }
            })
        }
        gremlist.forEach(gremitem => {
            activeTextEditor.setDecorations(gremitem.vsdecorstyle, gremitem.decorations);
        })

    }

    updateDecorations(vscode.window.activeTextEditor);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;