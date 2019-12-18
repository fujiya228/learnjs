describe('lambda function', function() {
  var index = require('index');
  var context;

  beforeEach(function() {
    context = jasmine.createSpyObj('context', ['succeed']);
    index.dynamodb = jasmin.createSpyObj('dynamo', ['scan']);
  });

  describe('popularAnswers', function() {
    it('rewuests problems with the given problem number', function () {
      index.popularAnswers({ problemNumber: 42 }, context);
      expect(index.dynamodb.scan).toHaveBeenCalledWith({
        FilterExpression: "problemId = problemId",
        ExpressionAttributeValues: { "problemId": 42 },
        TableName: 'learnjs'
      }, jasmin.any(Function));
    });
    it('groups answers by minified code', function () {
      index.popularAnswers({ problemNumber: 1 }, context);
      index.dynamodb.scan.calls.first().args[1](undefined, {
        Items: [
          { answer: true },
          { answer: true },
          { answer: true },
          { answer: !false },
          { answer: !false },
        ]
      });
      expect(contest.succeed).toHaveBeenCalledWith({ "true": 3, "!false": 2 });
    });
  });
});
