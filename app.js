'use strict';


// API Data Retrieval 
// =============== 
let sessionToken;

class NewApiCall {
  
  constructor(baseurl) {   
    this.sessionToken = null;
    this.baseURL = baseurl;
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
    questions.forEach(q => QUESTIONS.push(this.createQuestion(q)));
  }
  
  fetchAndSeedQuestions(amt, query, callback) {
    this.fetchQuestions(amt, query, res => {
      this.seedQuestions(res.results);
      callback();
    });  
  }

  createQuestion(question) {
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
  }
}

const TriviaDecoration = new ApiDecoration();
console.log(TriviaDecoration);

// Create Store
// =============== 
class newStore {

  constructor () {
    this.page = 'intro';
    this.currentQuestionIndex = null;
    this.userAnswers = [];
    this.feedback = null;
    this.sessionToken = null;
  }

  getInitialStore(){
    return {
      page: 'intro',
      currentQuestionIndex: null,
      userAnswers: [],
      feedback: null,
      sessionToken,
    };
  }

  getProgress() {
    return {
      current: store.currentQuestionIndex + 1,
      total: QUESTIONS.length
    };
  }

  getCurrentQuestion() {
    return QUESTIONS[store.currentQuestionIndex];
  }

  // Decorate API question object into our Quiz App question format
  getScore() {
    return store.userAnswers.reduce((accumulator, userAnswer, index) => {
      const question = getQuestion(index);

      if (question.correctAnswer === userAnswer) {
        return accumulator + 1;
      } else {
        return accumulator;
      }
    }, 0);
  }
}

const TriviaStore = new newStore();  
let store = TriviaStore.getInitialStore();  
console.log(store);


// HTML generator functions
// ========================

class newTemplate {
  constructor () {
    //
  }

  generateAnswerItemHtml(answer) {
    console.log(this.answer);
    return `
    <form class="generate-answers>
    <ul>
    <li class="answer-item">
    <fieldset>
      <input type="radio" name="answers" value="${answer}"  aria-live="polite" />
      <span class="answer-text">${answer}</span>
    </fieldset>
    </li>
    </ul>
    </form>
  `;
  }

  generateQuestionHtml(question) {
    const answers = question.answers
      .map((answer, index) => this.generateAnswerItemHtml(answer, index))
      .join('');

    return `
    <form label="question-form" aria-live="assertive">
      <fieldset>
        <legend class="question-text ">${question.text}</legend>
          ${answers}
          <button type="submit" class="btn btn-success submit-btn">Submit</button>
      </fieldset>
    </form>
  `;
  }

  generateFeedbackHtml(feedback) {
    return `
      <p aria-live="polite">
        ${feedback}
      </p>
      <button class="continue js-continue btn btn-secondary">Continue</button>
    `;
  }
}

const TriviaTemplate = new newTemplate();

// Top level components
// =============== 

const TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback', 
  'js-outro', 'js-quiz-status'
];

let QUESTIONS = [];

// Helper functions 
// ===============
const hideAll = function() {
  TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());
};

const getQuestion = function(index) {
  return QUESTIONS[index];
};


// Render function
// ===============
const render = function() {
  console.log(store);
  console.log(TriviaStore);
  console.log(TriviaStore.getCurrentQuestion);
  let html;
  hideAll();
  const question = TriviaStore.getCurrentQuestion();
  console.log(TriviaStore.getCurrentQuestion);
  const { feedback } = store; 
  const { current, total } = TriviaStore.getProgress();

  $('.js-score').html(`<span>Score: ${TriviaStore.getScore()}</span>`);
  $('.js-progress').html(`<span>Question ${current} of ${total}</span>`);

  switch (store.page) {
  case 'intro':
    if (sessionToken) {
      $('.js-start').attr('disabled', false);
    }
  
    $('.js-intro').show();
    break;
    
  case 'question':
    html = TriviaTemplate.generateQuestionHtml(question);
    $('.js-question').html(html);
    $('.js-question').show();
    $('.quiz-status').show();
    break;

  case 'answer':
    html = TriviaTemplate.generateFeedbackHtml(feedback);
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
  store = TriviaStore.getInitialStore();
  store.page = 'question';
  store.currentQuestionIndex = 0;
  const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
  TriviaDecoration.fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {
    render();
  });
};

const handleSubmitAnswer = function(e) {
  e.preventDefault();
  const question = TriviaStore.getCurrentQuestion();
  const selected = $('input:checked').val();
  store.userAnswers.push(selected);
  
  if (selected === question.correctAnswer) {
    store.feedback = 'That is correct!';
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
