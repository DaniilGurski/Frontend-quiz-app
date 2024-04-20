const mainElement    = document.querySelector(".main");
const headerElement  = document.querySelector(".header");
const quizMenu       = mainElement.querySelector(".quiz-menu");
const quizMain       = mainElement.querySelector(".quiz-main");
const quizEnd        = mainElement.querySelector(".quiz-end");
const menuOptionList = quizMenu.querySelector(".option-list");
const mainOptionList = quizMain.querySelector(".option-list");
const menuOptions    = Array.from(menuOptionList.children);
const mainOption     = Array.from(mainOptionList.children);

let quizzes  = {};
let currentQuiz = {};
let quizScore = 0;
let quizProgressValue = 1;
let quizTopic = "";


// load all quizzes to a variable
fetch("/data.json")
    .then(res => {
        if (res.ok) {
            return res.json();
        }

        throw new Error("response was not received");
    })

    .then(data => {
        quizzes = data["quizzes"];
    })

    .catch(errorMessage => {
        console.error(errorMessage);
    })


// switch to requested quiz frame / screen
function switchQuizFrame(frameName) {
    const frameSelectors = {
        "menu": ".quiz-menu",
        "main": ".quiz-main",
        "end":  ".quiz-end"
    };

    const targetFrame = mainElement.querySelector(frameSelectors[frameName]);
    const frames = Array.from(mainElement.children);

    frames.forEach((frame) => {
        frame.classList.toggle("none", frame !== targetFrame);
    })
}


// display amount questions left by text and progress bar
function updateProgressIndificators() {
    const quizProgressSpan = quizMain.querySelector("#question-index");
    const quizProgressBar  = quizMain.querySelector("#quiz-progress");

    quizProgressValue += 1;
    quizProgressSpan = quizProgressValue;
    quizProgressBar.value = quizProgressValue;
}


// display quiz topic in header and in the end screen
function updateQuizTopicIndificators() {
    const quizTopicIndificators = document.querySelectorAll(".quiz-topic");
    
    quizTopicIndificators.forEach(container => {
        const topicIcon = container.querySelector("img");
        const topicSpan = container.querySelector("span");

        topicIcon.src=currentQuiz["icon"];
        topicIcon.setAttribute("data-icon", quizTopic.toLowerCase());

        topicSpan.textContent = quizTopic
    })
}


// return requested value from a question object
function getQuestionDetails(requestedDetail) {
    const questionObject = currentQuiz["questions"][quizProgressValue];
    const {question, options, answer} = questionObject;
    const detailsMap = {
        "question": question,
        "options": options, 
        "answer": answer
    }

    if (requestedDetail in detailsMap === false) {
        console.error("No such detail available");
        return
    }

    return detailsMap[requestedDetail];
}


// mark correct and incorrect options
function markCorrectAnswer(optionText, correctAnswer, optionElement) {
    // set mark on label element for easier styling
    const labelElement = optionElement.querySelector("label");

    if (optionText !== correctAnswer) {
        labelElement.setAttribute("data-correct", "false"); 
        return
    }

    labelElement.setAttribute("data-correct", "true"); 
}


// render topic questions (text, options)
function renderQuestionDetails() {
    const questionText = quizMain.querySelector("#question-text");
    const answerOptionList = quizMain.querySelector(".option-list");
    const answerOptionElements = Array.from(answerOptionList.children);

    questionText.textContent = getQuestionDetails("question");
    answerOptionElements.forEach((option) => {
        const optionTextElement = option.querySelector("[data-option-text]");
        const optionIndex       = answerOptionElements.indexOf(option);
        const optionDetais      = getQuestionDetails("options");
        const optionText        = optionDetais[optionIndex];
        const correctAnswer     = getQuestionDetails("answer");

        optionTextElement.textContent = optionText;

        markCorrectAnswer(optionText, correctAnswer, option);
    });
}


function handleOptionSelection(event) {
}


// reset quiz progress and start rendering quiz
function startQuizAbout(topic) {
    currentQuiz = quizzes.filter(quiz => quiz["title"] === topic)[0];
    quizScore = 0;
    quizProgressValue = 1;

    switchQuizFrame("main");
    updateQuizTopicIndificators();
    renderQuestionDetails();
}


// handle quiz topic selection
menuOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
        // prevent eventListener from running twice.
        event.preventDefault()

        quizTopic = event.currentTarget.getAttribute("data-quiz-option");
        startQuizAbout(quizTopic)
    })
})


// TODO: handle quiz answer selection via after submiting the answer



