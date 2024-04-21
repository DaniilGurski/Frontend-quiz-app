const mainElement    = document.querySelector(".main");
const headerElement  = document.querySelector(".header");
const quizMenu       = mainElement.querySelector(".quiz-menu");
const quizMain       = mainElement.querySelector(".quiz-main");
const quizEnd        = mainElement.querySelector(".quiz-end");
const menuOptionList = quizMenu.querySelector(".option-list");
const mainOptionList = quizMain.querySelector(".option-list");
const menuOptions    = Array.from(menuOptionList.children);
const mainOptions    = Array.from(mainOptionList.children);
const submitButton   = quizMain.querySelector("#submit-button");

let quizzes  = {};
let currentQuiz = {};
let quizScore = 0;
let quizProgressValue = 1;
let quizTopic = "";


const markAsPicked = (event) => {
    // prevents double execution of the function due to the connection of the input and the label
    if (event.currentTarget.hasAttribute("data-picked")) {
        return
    }

    // remvoe data-picked from option that have this attribute
    mainOptions.forEach((option) => {
        if (option.hasAttribute("data-picked") === "false") {
            return
        }

        option.removeAttribute("data-picked");
    })

    event.currentTarget.setAttribute("data-picked", "");
}
const getQuizTopic = (event) => {
    // prevent eventListener from running twice.
    event.preventDefault()

    quizTopic = event.currentTarget.getAttribute("data-quiz-option");
    startQuizAbout(quizTopic)
}
const handleSubmitButton = () => {
    const anyOptionPicked = mainOptions.some((option) => option.hasAttribute("data-picked"));
    if (!anyOptionPicked) {
        return;
    }
    
    const optionInputElements = quizMain.querySelectorAll("input");

    optionInputElements.forEach((input) => {
        input.setAttribute("disabled", "true");
    })

    compareUserAnswer()
}


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
    if (optionText !== correctAnswer) {
        optionElement.setAttribute("data-correct", "false"); 
        return
    }

    optionElement.setAttribute("data-correct", "true"); 
}


// change status icon (correct / incorrect) inside given option element
function changeCorrectIcon(option, status) {
    const statusIconSrc = {
        "correct": "icon-correct.svg",
        "incorrect": "icon-incorrect.svg"
    };

    const statusIcon = option.querySelector(".option__status-indicator");
    statusIcon.src += statusIconSrc[status];
}


// compare user answer with the correct one, show results
function compareUserAnswer() {
    const pickedOption = mainOptionList.querySelector("li[data-picked]");
    
    if (pickedOption.dataset.correct === "true") {
        quizScore += 1;
        pickedOption.classList.add("option-list__item--picked-correctly");
        changeCorrectIcon(pickedOption, "correct");


        
    } else {
        quizScore -= 1;
        pickedOption.classList.add("option-list__item--picked-incorrectly");
        changeCorrectIcon(pickedOption, "incorrect");

        const correctOption = mainOptions.filter((option) => option.dataset.correct === "true")[0];
        changeCorrectIcon(correctOption, "correct");
    }

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
    option.addEventListener("click", getQuizTopic);
})


// mark clicked option with special data attribute
mainOptions.forEach((option) => {
    option.addEventListener("click", markAsPicked);
});


// disable option selection after submiting (if any option was even picked)
submitButton.addEventListener("click", handleSubmitButton);



