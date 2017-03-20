const vscode = require('vscode');

function activate(context) {
    const skin = {};
    skin.common = {
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
    skin.withFill = {
        fill: 'red',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'red'
    }
    skin.bordered = {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'red'
    }
    function gremlin(name,skin) {
        return {name,skin};
        /* other properties will be:
        vsdecorstyle: null, // merged with skin.common
        decorations: [], // "instances"
        charpointstring: null // for hint
        */
    };
    const bestiary = [];
    bestiary[0x0020] = gremlin("simple space",skin.withFill);
    bestiary[0x200b] = gremlin("zero-width space",skin.withFill);
    bestiary[0x00a0] = gremlin('non-breaking space');
    bestiary[0xfeff] = gremlin('zero width no-break space, BOM', skin.bordered);
    bestiary[0x2060] = gremlin('word joiner', {borderWidth: '3px',borderStyle: 'solid'});
    /*
        https://www.compart.com/en/unicode/category/Cf
        https://www.cs.tut.fi/~jkorpela/chars/spaces.html
		http://graphemica.com/blocks/general-punctuation
        http://graphemica.com/categories/control-other
        http://graphemica.com/categories/format-other
        http://graphemica.com/categories/space-separator
        http://graphemica.com/2061
        https://en.wikibooks.org/wiki/Unicode/List_of_useful_symbols
        https://en.wikipedia.org/wiki/Whitespace_character
    */

    bestiary.forEach((gremitem,charpoint) => {
        let individualStyle = skin[gremitem.decorationStyleName] || {};
        let style = Object.assign({}, skin.common, individualStyle );
        gremitem.charpointstring = 'U+' + charpoint.toString(16).replace(/.*/, m => m.length < 4 ? '0'.repeat(4 - m.length) + m : m);
        gremitem.vsdecorstyle = vscode.window.createTextEditorDecorationType(style);
        gremitem.regexp = RegExp(String.fromCodePoint(charpoint) + '+' )
    });

    const gremrgx = RegExp( '(' + Object.keys(bestiary).map(n=>String.fromCodePoint(n)).join('|') + ')\\1*' , 'g' );


    function updateDecorations(activeTextEditor) {
        if (!activeTextEditor) {
            return;
        }

        const doc = activeTextEditor.document;

        bestiary.forEach((gremitem) => {
            gremitem.decorations = []
        });

        for (let i = 0; i < doc.lineCount; i++) {
            let line = doc.lineAt(i);
            let lineText = line.text;
            let match;
            let gremitem;
            gremrgx.lastIndex = -1;
            if( !gremrgx.test(lineText) ) {
                continue;
            }
            gremrgx.lastIndex = -1;
            while (match = gremrgx.exec(lineText)) {
                gremitem = bestiary[match[1].charCodeAt(0)] // I hope we will stay in BMP and will not need to enter surrogates :|
                let startPos = new vscode.Position(i, match.index);
                let lgt = match[0].length;
                let endPos = new vscode.Position(i, match.index + lgt);
                const decoration = {
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: lgt + " " + gremitem.name + (lgt > 1 ? "s" : "") +
                        " (unicode " + gremitem.charpointstring + ") here"
                };
                gremitem.decorations.push(decoration);
            }
        }
        bestiary.forEach(gremitem => {
            activeTextEditor.setDecorations(gremitem.vsdecorstyle, gremitem.decorations);
        })

    }

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


    updateDecorations(vscode.window.activeTextEditor);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;