'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.invoke = exports.commandDescriptor = exports.usage = exports.parse = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errorReporter = require('../util/errorReporter');

var _errorReporter2 = _interopRequireDefault(_errorReporter);

var _graphQLFetcher = require('../util/graphQLFetcher');

var _graphQLFetcher2 = _interopRequireDefault(_graphQLFetcher);

var _getServiceBaseURL = require('../util/getServiceBaseURL');

var _getServiceBaseURL2 = _interopRequireDefault(_getServiceBaseURL);

var _loadCommand2 = require('../util/loadCommand');

var _loadCommand3 = _interopRequireDefault(_loadCommand2);

var _composeInvoke = require('../util/composeInvoke');

var _composeInvoke2 = _interopRequireDefault(_composeInvoke);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _loadCommand = (0, _loadCommand3.default)('log');

var parse = _loadCommand.parse;
var usage = _loadCommand.usage;
var commandDescriptor = _loadCommand.commandDescriptor;
exports.parse = parse;
exports.usage = usage;
exports.commandDescriptor = commandDescriptor;

var LogRetroCommand = function () {
  function LogRetroCommand(lgJWT, notify, formatMessage, formatError) {
    _classCallCheck(this, LogRetroCommand);

    this.runGraphQLQuery = (0, _graphQLFetcher2.default)(lgJWT, (0, _getServiceBaseURL2.default)(_getServiceBaseURL.GAME));
    this.notifyMsg = function (msg) {
      return notify(formatMessage(msg));
    };
    this.notifyError = function (err) {
      return notify(formatError(err));
    };
  }

  _createClass(LogRetroCommand, [{
    key: 'invokeResponseAPI',
    value: function invokeResponseAPI(questionNumber, responseParams) {
      var mutation = {
        query: '\n        mutation($response: CLISurveyResponse!) {\n          saveRetrospectiveCLISurveyResponse(response: $response) {\n            createdIds\n          }\n        }\n      ',
        variables: { response: { questionNumber: questionNumber, responseParams: responseParams } }
      };
      return this.runGraphQLQuery(mutation).then(function (data) {
        return data.saveRetrospectiveCLISurveyResponse;
      });
    }
  }, {
    key: 'invokeSurveyQuestionAPI',
    value: function invokeSurveyQuestionAPI(questionNumber) {
      var query = {
        query: 'query($questionNumber: Int!) {\n          getRetrospectiveSurveyQuestion(questionNumber: $questionNumber) {\n            ... on SurveyQuestionInterface {\n              id subjectType responseType body\n              responseIntructions\n            }\n            ... on SinglePartSubjectSurveyQuestion {\n              subject { id name handle }\n            }\n            ... on MultiPartSubjectSurveyQuestion {\n              subject { id name handle }\n            }\n          }\n        }',
        variables: { questionNumber: questionNumber }
      };
      return this.runGraphQLQuery(query).then(function (data) {
        return data.getRetrospectiveSurveyQuestion;
      });
    }
  }, {
    key: 'invokeGetSurveyAPI',
    value: function invokeGetSurveyAPI() {
      var query = {
        query: 'query {\n          getRetrospectiveSurvey {\n            questions {\n              ... on SurveyQuestionInterface {\n                id subjectType responseType body\n                responseIntructions\n              }\n              ... on SinglePartSubjectSurveyQuestion {\n                subject { id name handle }\n              }\n              ... on MultiPartSubjectSurveyQuestion {\n                subject { id name handle }\n              }\n            }\n          }\n        }'
      };
      return this.runGraphQLQuery(query).then(function (data) {
        return data.getRetrospectiveSurvey;
      });
    }
  }, {
    key: 'formatQuestion',
    value: function formatQuestion(question, _ref) {
      var questionNumber = _ref.questionNumber;
      var skipInstructions = _ref.skipInstructions;

      var questionText = '*Q' + questionNumber + '*: ' + question.body;
      if (!skipInstructions && question.responseIntructions) {
        questionText = questionText + '\n\n' + question.responseIntructions;
      }
      return questionText;
    }
  }, {
    key: 'printSurvey',
    value: function printSurvey() {
      var _this = this;

      return this.invokeGetSurveyAPI().then(function (survey) {
        return _this.notifyMsg(survey.questions.map(function (question, i) {
          return _this.formatQuestion(question, { questionNumber: i + 1, skipInstructions: true });
        }).join('\n'));
      }).catch(function (error) {
        _errorReporter2.default.captureException(error);
        _this.notifyError('' + (error.message || error));
      });
    }
  }, {
    key: 'printSurveyQuestion',
    value: function printSurveyQuestion(questionNumber) {
      var _this2 = this;

      return this.invokeSurveyQuestionAPI(questionNumber).then(function (question) {
        return _this2.notifyMsg(_this2.formatQuestion(question, { questionNumber: questionNumber }));
      }).catch(function (error) {
        _errorReporter2.default.captureException(error);
        _this2.notifyError('' + (error.message || error));
      });
    }
  }, {
    key: 'logReflection',
    value: function logReflection(questionNumber, responseParams) {
      var _this3 = this;

      return this.invokeResponseAPI(questionNumber, responseParams).then(function () {
        return _this3.notifyMsg('Reflection loggeid for question ' + questionNumber);
      }).catch(function (error) {
        _errorReporter2.default.captureException(error);
        _this3.notifyError('API invocation failed: ' + (error.message || error));
      });
    }
  }]);

  return LogRetroCommand;
}();

var invoke = exports.invoke = (0, _composeInvoke2.default)(parse, usage, function (args, notify, options) {
  var lgJWT = options.lgJWT;
  var lgPlayer = options.lgPlayer;
  var formatError = options.formatError;
  var formatMessage = options.formatMessage;

  if (!lgJWT || !lgPlayer || !lgPlayer.id) {
    return Promise.reject('You are not a player in the game.');
  }
  if (args.retro) {
    var retro = new LogRetroCommand(lgJWT, notify, formatMessage, formatError);

    if (typeof args.question === 'string' && args.question.match(/^\d+$/)) {
      var questionNumber = parseInt(args.question, 10);
      var responseParams = args._;
      if (responseParams.length === 0) {
        return retro.printSurveyQuestion(questionNumber);
      }
      return retro.logReflection(questionNumber, responseParams);
    }
    return retro.printSurvey();
  }
  return Promise.reject('Invalid arguments. Try --help for usage.');
});