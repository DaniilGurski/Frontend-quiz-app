const mainElement      = document.querySelector(".main");
const headerElement    = document.querySelector(".header");
const quizMenu         = mainElement.querySelector(".quiz-menu");
const quizMain         = mainElement.querySelector(".quiz-main");
const quizEnd          = mainElement.querySelector(".quiz-end");
const menuOptionList   = quizMenu.querySelector(".option-list");
const answerOptionList = quizMain.querySelector(".option-list");
const menuOptions      = Array.from(menuOptionList.children);
const answerOptions    = Array.from(answerOptionList.children);
const submitButton     = quizMain.querySelector("#submit-button");
const playAgainButton  = quizEnd.querySelector("#play-again-button");

let quizzes = {};
let newQuiz;


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


function Quiz(selectedTopic) {
    this.currentQuizData = {};
    this.quizScore = 0
    this.quizProgressValue = 0;
    this.quizTopic = selectedTopic;


    this.startQuizAbout = () => {
        this.currentQuizData = quizzes.filter(quiz => quiz["title"] === selectedTopic)[0];
        this.quizScore = 0;
        this.quizProgressValue = 1;

        switchQuizFrame("main");
        resetOptions();
        renderQuizDetails();
    }

    // return requested value from a question object
    this.getQuizDetails = (requestedDetail) => {
        const questionArray = this.currentQuizData["questions"];
        console.log(questionArray);

        const questionObject = questionArray[this.quizProgressValue];
        const {question, options, answer} = questionObject;
        const detailsMap = {
            "question": question,
            "options": options, 
            "answer": answer,
            "quiz-length": questionArray.length
        }
    
        if (requestedDetail in detailsMap === false) {
            console.error("No such detail available");
            return
        }
    
        return detailsMap[requestedDetail];
    }


    this.getTopicIcon = () => {
        return this.currentQuizData["icon"];
    }
}


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


// display quiz topic in header and in the end screen
function updateQuizTopicIndificators() {
    const quizTopicIndificators = document.querySelectorAll(".quiz-topic");
    
    quizTopicIndificators.forEach(container => {
        const topicIcon = container.querySelector("img");
        const topicSpan = container.querySelector("span");

        topicIcon.src= newQuiz.getTopicIcon();
        topicIcon.setAttribute("data-icon", newQuiz.quizTopic.toLowerCase());

        topicSpan.textContent = newQuiz.quizTopic;
    })
}


// sets visual topic marker in header and ending frame
function updateProgressIndicators() {
    const questionIndexElement = mainElement.querySelector("#question-index");
    const progressBarElement   = mainElement.querySelector("#quiz-progress");

    questionIndexElement.textContent = newQuiz.quizProgressValue;
    progressBarElement.value = newQuiz.quizProgressValue;
}


// TODO: Move to render quiz details function ?
function renderEndingFrame() {
    const quizScoreElement = quizEnd.querySelector("#quiz-score");
    const quizLengthElement = quizEnd.querySelector("#quiz-length");

    quizScoreElement.textContent = newQuiz.quizScore;
    quizLengthElement.textContent = newQuiz.getQuizDetails("quiz-length");
}


// remove data attributes for styling, logic
function resetOptions() {
    const removeAttributes = ["data-pick", "data-correct-option", "data-revealed"]
    answerOptions.forEach((answerOption) => {
        const input = answerOption.querySelector("input"); 

        input.removeAttribute("disabled"); 

        if (input.checked) {
            input.checked = false;
        }

        removeAttributes.forEach((attribute) => {
            if (answerOption.hasAttribute(attribute)) {
                answerOption.removeAttribute(attribute);
            }
        })
    })
}


// render topic questions (text, options)
function renderQuizDetails() {
    updateProgressIndicators();

    const questionText = quizMain.querySelector("#question-text");
    questionText.textContent = newQuiz.getQuizDetails("question");

    answerOptions.forEach((answerOption) => {
        const optionDetais      = newQuiz.getQuizDetails("options");
        const correctAnswer     = newQuiz.getQuizDetails("answer");
        const optionIndex       = answerOptions.indexOf(answerOption);
        const optionText        = optionDetais[optionIndex];

        const optionTextElement = answerOption.querySelector("[data-option-text]");
        optionTextElement.textContent = optionText;

        // mark the correct option for further checks
        if (optionText === correctAnswer) {
            answerOption.setAttribute("data-correct-option", "");
        }
    });
}


// returns true when next answer submition compleates the quiz
function isQuizCompleated() {
    const quizLength = newQuiz.getQuizDetails("quiz-length");
    const currentProgress = newQuiz.quizProgressValue;

    if (currentProgress + 1 === quizLength) {
        return true
    }
    return false
}


// visually outline the option depending on its correctness
function revealOptionStatus(optionElement, isCorrect, outlineOption) {
    optionElement.setAttribute("data-revealed", "")
    const statusIconPath = isCorrect ? "dist/img/icon-correct.svg" : "dist/img/icon-incorrect.svg";
    const statusIcon = optionElement.querySelector(".option__status-indicator");
    statusIcon.src = statusIconPath

    if (outlineOption) {
        optionElement.dataset.pick = isCorrect ? "correct" : "incorrect";
    }
}


// starting quiz when topic selected in the menu 
menuOptions.forEach((menuOption) => {
    menuOption.addEventListener("click", (event) => {
        event.preventDefault();

        const selectedOption = event.currentTarget;
        const selectedTopic  = selectedOption.getAttribute("data-option-topic");

        newQuiz = new Quiz(selectedTopic);
        newQuiz.startQuizAbout()
        updateQuizTopicIndificators();
    })
})


// answer submition, answer checking and results
// TODO: make prettier
submitButton.addEventListener("click", (event) => {
    const errorMessage = quizMain.querySelector("#error-message");
    const isOptionPicked = answerOptionList.querySelector("input:checked");
    errorMessage.classList.toggle("hidden", isOptionPicked)


    if (!isOptionPicked) {
        return
    }
    

    if (submitButton.dataset.action === "next") {
        const quizCompleated = isQuizCompleated();

        if (quizCompleated) {
            switchQuizFrame("end");
            renderEndingFrame();
            return
        }

        submitButton.setAttribute("data-action", "submit");
        newQuiz.quizProgressValue += 1;
        resetOptions();
        renderQuizDetails();
        return;
    } 
    
    submitButton.setAttribute("data-action", "next");
    submitButton.textContent = "Next Question";


    let pickedOption;
    const correctOption = answerOptionList.querySelector("[data-correct-option]");

    answerOptions.forEach((answerOption) => {
        const answerOptionInput = answerOption.querySelector("input")
        if (answerOptionInput.checked) {
            pickedOption = answerOption;
        }
        answerOptionInput.setAttribute("disabled", true);
    })

    const isCorrect = pickedOption.hasAttribute("data-correct-option");
    revealOptionStatus(pickedOption, isCorrect, true);
    
    if (isCorrect) {
        newQuiz.quizScore += 1;
    } else {
        revealOptionStatus(correctOption, true, false)
    }
})


playAgainButton.addEventListener("click", (event) => {
    switchQuizFrame("menu")
})