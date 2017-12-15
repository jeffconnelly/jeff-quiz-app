'use strict';

// -Create classes so any functions related to a certain part of our process in the app, bunch them together into an 
// appropriate object and have the methods on that object available.
// -Want to get away from all of our globals.  
// -Find a place for it within one of our tobal level objects we'll create
// -Any function in the global space should be placed within the context of one of the top level objects


// Group STORE manipulation functions together
// Group render functions together, render function can sit in object as well?
// Group template generator functions together
// Group event listeners together?



// Group API functions together

// API Data Retrieval 
// ===============
let sessionToken;

class NewApiCall {
  
  constructor(baseurl) {   
    this.sessionToken = null;
    this.baseURL = baseurl;
    // this.fetchToken();
  }

  //Set API methods 
  testNewObject() {
    console.log('hello');
  }

  buildTokenUrl() {
    console.log(this.baseURL + '/api_token.php');
    return new URL(this.baseURL + '/api_token.php');
  }

  buildBaseUrl(amt = 10, query = {}) {
    const url = new URL(this.baseURL + '/api.php');
    const queryKeys = Object.keys(query);
    url.searchParams.set('amount', amt);
    
    if (store.sessionToken) {
      url.searchParams.set('token', store.sessionToken);
    }
  
    queryKeys.forEach(key => url.searchParams.set(key, query[key]));
    return url;
  }

  fetchToken(callback) {
    if (sessionToken) {
      return callback();
    }

    const url = this.buildTokenUrl();
    url.searchParams.set('command', 'request');
  
    $.getJSON(url, res => {
      sessionToken = res.token;
      callback();
    }, err => console.log(err));
  }
}


// Decorate API Data Retrieval 
// ===============
class ApiDecoration  {
  
  constructor() {   
  
  }

  fetchQuestions(amt, query, callback) {
    $.getJSON(TriviaCall.buildBaseUrl(amt, query), callback, err => console.log(err.message));
  }
    
  seedQuestions(questions) {
    QUESTIONS.length = 0;
    questions.forEach(q => QUESTIONS.push(createQuestion(q)));
  }
  
  fetchAndSeedQuestions(amt, query, callback) {
    this.fetchQuestions(amt, query, res => {
      this.seedQuestions(res.results);
      callback();
    });  
  }
}

const TriviaDecoration = new ApiDecoration();
console.log(TriviaDecoration);

// class Store {

// }


// class Renderer {

// }



const TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback', 
  'js-outro', 'js-quiz-status'
];

let QUESTIONS = [];

// token is global because store is reset between quiz games, but token should persist for 
// entire session


const getInitialStore = function(){
  return {
    page: 'intro',
    currentQuestionIndex: null,
    userAnswers: [],
    feedback: null,
    sessionToken,
  };
};

let store = getInitialStore();

// Helper functions
// ===============
const hideAll = function() {
  TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());
};

// Decorate API question object into our Quiz App question format
const createQuestion = function(question) {
  // Copy incorrect_answers array into new all answers array
  const answers = [ ...question.incorrect_answers ];

  // Pick random index from total answers length (incorrect_answers length + 1 correct_answer)
  const randomIndex = Math.floor(Math.random() * (question.incorrect_answers.length + 1));

  // Insert correct answer at random place
  answers.splice(randomIndex, 0, question.correct_answer);

  return {
    text: question.question,
    correctAnswer: question.correct_answer,
    answers
  };
};

const getScore = function() {
  return store.userAnswers.reduce((accumulator, userAnswer, index) => {
    const question = getQuestion(index);

    if (question.correctAnswer === userAnswer) {
      return accumulator + 1;
    } else {
      return accumulator;
    }
  }, 0);
};

const getProgress = function() {
  return {
    current: store.currentQuestionIndex + 1,
    total: QUESTIONS.length
  };
};

const getCurrentQuestion = function() {
  return QUESTIONS[store.currentQuestionIndex];
};

const getQuestion = function(index) {
  return QUESTIONS[index];
};

// HTML generator functions
// ========================
const generateAnswerItemHtml = function(answer) {
  return `
    <li class="answer-item">
      <input type="radio" name="answers" value="${answer}" />
      <span class="answer-text">${answer}</span>
    </li>
  `;
};

const generateQuestionHtml = function(question) {
  const answers = question.answers
    .map((answer, index) => generateAnswerItemHtml(answer, index))
    .join('');

  return `
    <form>
      <fieldset>
        <legend class="question-text">${question.text}</legend>
          ${answers}
          <button type="submit">Submit</button>
      </fieldset>
    </form>
  `;
};

const generateFeedbackHtml = function(feedback) {
  return `
    <p>
      ${feedback}
    </p>
    <button class="continue js-continue">Continue</button>
  `;
};

// Render function - uses `store` object to construct entire page every time it's run
// ===============
const render = function() {
  let html;
  hideAll();

  const question = getCurrentQuestion();
  const { feedback } = store; 
  const { current, total } = getProgress();

  $('.js-score').html(`<span>Score: ${getScore()}</span>`);
  $('.js-progress').html(`<span>Question ${current} of ${total}`);

  switch (store.page) {
  case 'intro':
    if (sessionToken) {
      $('.js-start').attr('disabled', false);
    }
  
    $('.js-intro').show();
    break;
    
  case 'question':
    html = generateQuestionHtml(question);
    $('.js-question').html(html);
    $('.js-question').show();
    $('.quiz-status').show();
    break;

  case 'answer':
    html = generateFeedbackHtml(feedback);
    $('.js-question-feedback').html(html);
    $('.js-question-feedback').show();
    $('.quiz-status').show();
    break;

  case 'outro':
    $('.js-outro').show();
    $('.quiz-status').show();
    break;

  default:
    return;
  }
};

// Event handler functions
// =======================
const handleStartQuiz = function() {
  store = getInitialStore();
  store.page = 'question';
  store.currentQuestionIndex = 0;
  const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
  TriviaDecoration.fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {
    render();
  });
};

const handleSubmitAnswer = function(e) {
  e.preventDefault();
  const question = getCurrentQuestion();
  const selected = $('input:checked').val();
  store.userAnswers.push(selected);
  
  if (selected === question.correctAnswer) {
    store.feedback = 'You got it!';
  } else {
    store.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
  }

  store.page = 'answer';
  render();
};

const handleNextQuestion = function() {
  if (store.currentQuestionIndex === QUESTIONS.length - 1) {
    store.page = 'outro';
    render();
    return;
  }

  store.currentQuestionIndex++;
  store.page = 'question';
  render();
};

const TriviaCall = new NewApiCall('https://opentdb.com');  

// On DOM Ready, run render() and add event listeners
$(() => {
  // Run first render
  render();
  
  // Fetch session token, re-render when complete
  TriviaCall.fetchToken(() => {
    render();
  });

  $('.js-intro, .js-outro').on('click', '.js-start', handleStartQuiz);
  $('.js-question').on('submit', handleSubmitAnswer);
  $('.js-question-feedback').on('click', '.js-continue', handleNextQuestion);
});
