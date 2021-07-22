function loadFile(jsonPath, isAsync, callback) {   
    let xobj = new XMLHttpRequest()
        xobj.overrideMimeType("text/plain")
    xobj.open('GET', jsonPath, isAsync)
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText)
          }
    }
    xobj.send(null)
}

function loadJSON(jsonPath, isAsync, callback) {   
    let xobj = new XMLHttpRequest()
        xobj.overrideMimeType("application/json")
    xobj.open('GET', jsonPath, isAsync)
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText)
          }
    }
    xobj.send(null)
}

Array.prototype.head = function() {
    return this[0]
}
Array.prototype.last = function() {
    return this[this.length - 1]
}
Array.prototype.tail = function() {
    return this.slice(1)
}
Array.prototype.init = function() {
    return this.slice(0, this.length - 1)
}
Array.prototype.sum = function(selector) {
    return this.reduce((acc,val) => acc + ((selector === undefined) ? val : selector(val)), 0)
}
Array.prototype.max = function(selector) {
    return this.reduce((acc,val) => (((selector === undefined) ? val : selector(val)) > acc) ? ((selector === undefined) ? val : selector(val)) : acc, 0)
}

function pageinit() {
    let treetags = document.getElementsByTagName("TREE")
    for (let i = 0; i < treetags.length; i++) {
        let treeobj = treetags.item(i)
        let filename = treeobj.attributes.file.value
        let title = treeobj.attributes.title.value
        loadFile(filename, true, text => {
            treeobj.innerHTML = blocksToHtml(treeToBlocks(textToTree(title, text)))
        })
    }
}

function textToTree(title, text) {
    let Node = function(name) {
        this.node = name
        this.children = []
    }
    
    let rootobj = new Node(`<treeroot>${title}</treeroot>`)
    let objNavStack = []
    let oldDepth = -1
    let lines = text.split('\n')
    
    objNavStack.push(rootobj)
    
    lines.forEach(line => {
        let depth = line.replaceAll(/[^\t]+/g, '').length
        let name = line.substring(depth)
        if (name.length > 0) {
        
            // close a tag
            if (name.startsWith("<") && name.endsWith(">") && !name.includes("</")) {
                let tagname = name.substring(1, Math.min((name.indexOf(' ') > 0 ? name.indexOf(' ') : 2147483647), name.indexOf('>')))
                name = `<${tagname}></${tagname}>`
            }
            
            // create a tag
            if (!name.startsWith("<") && !name.endsWith(">")) {
                let tagname = `treenode`
                name = `<${tagname} depth=${depth}>${name}</${tagname}>`
            }
            
            let depthDiff = depth - oldDepth
            if (depthDiff == 0) {
                objNavStack.pop()
                let newchild = new Node(name)
                objNavStack.last().children.push(newchild)
                objNavStack.push(newchild)
            }
            else if (depthDiff > 0) {
                let newchild = new Node(name)
                objNavStack.last().children.push(newchild)
                objNavStack.push(newchild)
            }
            else {
                for (let k = 0; k < -depthDiff + 1; k++) {
                    objNavStack.pop()
                }
                let newchild = new Node(name)
                objNavStack.last().children.push(newchild)
                objNavStack.push(newchild)
            }
   
            oldDepth = depth
        }
    })
    
    return rootobj
}

function treeToBlocks(t) {
    let tree = JSON.parse(JSON.stringify(t))
        
    function _rec(tree, depth, siblingOrd, parent, leafNodeCnt) {
        // traverse children
        if (tree.children.length < 1) {
            tree.row = depth
            tree.col = (parent.col||0) + siblingOrd + (parent.width||1) - 1
            tree.width = 1
            tree.isleaf = true
            return tree.width
        }
        else {
            tree.col = (parent.col||0) + siblingOrd + (parent.width||1) - 1
            tree.width = tree.children.map((it,index) => 
                _rec(it, depth + 1, ((index == 0) ? 0 : tree.children.slice(0, index).sum(it => it.width)), tree, leafNodeCnt)
            ).sum()
            tree.row = depth
            return tree.width
        }
    }
    
    _rec(tree, 0, 0, {col:0,width:1}, 0)
    
    return tree
}

function blocksToHtml(tree) {
    let out = "<treewrap>"
    
    function _rec(tree) {
        // traverse children
        if (tree.children.length < 1) {
            out += `<treeelem ${(tree.isleaf) ? 'isleaf=1' : ''} style="grid-row:${tree.row+1};grid-column:${tree.col+1}/${tree.col+tree.width+1}">${tree.node}</treeelem>`
        }
        else {
            tree.children.forEach(it => 
                _rec(it)
            )
            out += `<treeelem style="grid-row:${tree.row+1};grid-column:${tree.col+1}/${tree.col+tree.width+1}">${tree.node}</treeelem>`
        }
    }
    
    _rec(tree)
    
    out += "</treewrap>"
    
    return out
}
