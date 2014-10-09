// traverseAndUpdateAst.js
// =======================
// Uses Estraverse to traverse the AST and convert all define() and require() methods to standard JavaScript

define([
  'errorMsgs',
  'convertDefinesAndRequires'
], function(
  errorMsgs,
  convertDefinesAndRequires
) {
  return function traverseAndUpdateAst(obj) {
    var amdclean = this,
      options = amdclean.options,
      ast = obj.ast;

    if (!_.isPlainObject(obj)) {
      throw new Error(errorMsgs.invalidObject('traverseAndUpdateAst'));
    }

    if (!ast) {
      throw new Error(errorMsgs.emptyAst('traverseAndUpdateAst'));
    }

    if (!_.isPlainObject(estraverse) || !_.isFunction(estraverse.replace)) {
      throw new Error(errorMsgs.estraverse);
    }

    estraverse.replace(ast, {
      'enter': function(node, parent) {
        var ignoreComments;

        if (node.type === 'Program') {
          ignoreComments = (function() {
            var arr = [],
              currentLineNumber;

            amdclean.comments = node.comments;

            _.each(node.comments, function(currentComment) {
              var currentCommentValue = (currentComment.value).trim();

              if (currentCommentValue === options.commentCleanName) {
                arr.push(currentComment);
              }
            });
            return arr;
          }());

          _.each(ignoreComments, function(currentComment) {
            currentLineNumber = currentComment.loc.start.line;
            amdclean.matchingCommentLineNumbers[currentLineNumber] = true;
          });

          return node;
        }

        return convertDefinesAndRequires.call(amdclean, node, parent);
      },
      'leave': function(node) {
        return node;
      }
    });

    return ast;
  };
});