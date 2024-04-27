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
const srOnlyResultElement = quizMain.querySelector("#selection-result");

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

    // load new quiz, reset quiz data and start
    this.startQuizAbout = () => {
        this.currentQuizData = quizzes.find(quiz => quiz["title"] === this.quizTopic);

        if (!this.currentQuizData) {
            throw new Error(`No quiz found with the title ${this.quizTopic}`)
        }

        this.quizScore = 0;
        this.quizProgressValue = 0;

        switchQuizFrame("main");
        renderQuizDetails("main");
    }

    // return requested value from a question object
    this.getQuizDetails = (requestedDetail) => {
        const questionArray = this.currentQuizData["questions"];

        const questionObject = questionArray[this.quizProgressValue];
        const {question, options, answer} = questionObject;
        
        const quizDetails = {
            "question": question,
            "options": options, 
            "answer": answer,
            "quiz-length": questionArray.length
        }
    
        if (requestedDetail in quizDetails === false) {
            throw new Error(`No such detail available: ${requestedDetail}`);
        }
    
        return quizDetails[requestedDetail];
    }


    // returns topic icon to render
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

        topicIcon.src= newQuiz.getTopicIcon()
        topicIcon.setAttribute("data-icon", newQuiz.quizTopic.toLowerCase());

        topicSpan.textContent = newQuiz.quizTopic;
    })
}


// display quiz progress by text and progress bar
function updateProgressIndicators() {
    const questionIndexElement = mainElement.querySelector("#question-index");
    const progressBarElement   = mainElement.querySelector("#quiz-progress");

    questionIndexElement.textContent = newQuiz.quizProgressValue + 1;
    progressBarElement.value = newQuiz.quizProgressValue + 1;
}


// remove data attributes for styling, logic from option elements
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


// render different quiz frames
function renderQuizDetails(frame) {
    updateProgressIndicators();
    resetOptions();

    if (frame === "end") {
        const quizScoreElement = quizEnd.querySelector("#quiz-score");
        const quizLengthElement = quizEnd.querySelector("#quiz-length");
    
        quizScoreElement.textContent = newQuiz.quizScore;
        quizLengthElement.textContent = newQuiz.getQuizDetails("quiz-length");
        return
    } else if (frame === "main") {
        const questionText = quizMain.querySelector("#question-text");
        questionText.textContent = newQuiz.getQuizDetails("question");
    
        answerOptions.forEach((answerOption) => {
            const optionDetais      = newQuiz.getQuizDetails("options");
            const correctAnswer     = newQuiz.getQuizDetails("answer");
            const optionIndex       = answerOptions.indexOf(answerOption);
            const optionText        = optionDetais[optionIndex];
            const radioElement      = answerOption.querySelector("input[type='radio']");
    
            
            const optionTextElement = answerOption.querySelector("[data-option-text]");
            optionTextElement.textContent = optionText;
            radioElement.ariaLabel= `answer option: ${optionText}`;
            
            // mark the correct option for further checks
            if (optionText === correctAnswer) {
                answerOption.setAttribute("data-correct-option", "");
            }
        });
    }
}


// returns true if no more questions are left
function isQuizCompleated() {
    const quizLength = newQuiz.getQuizDetails("quiz-length");
    const currentProgress = newQuiz.quizProgressValue;

    return (currentProgress + 1 === quizLength);
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


// start new quiz when topic selected in the menu 
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
submitButton.addEventListener("click", (event) => {
    const isOptionPicked = answerOptionList.querySelector("input:checked");
    const quizCompleated = isQuizCompleated();
    
    // show error message if no option is selected and show show quiz results if no more questions are left
    if (!isOptionPicked) {
        const errorMessage = quizMain.querySelector("#error-message");
        errorMessage.classList.toggle("hidden", isOptionPicked)
        return
    } 
    

    // move to next question after option selection is submited or show results if no questions are left
    if (submitButton.dataset.action === "next") {
        if (quizCompleated) {
            switchQuizFrame("end");
            renderQuizDetails("end")
            return
        } 

        newQuiz.quizProgressValue += 1;

        srOnlyResultElement.textContent = "";
        submitButton.setAttribute("data-action", "submit");
        renderQuizDetails("main");
        return;
    } 
    

    submitButton.setAttribute("data-action", "next");
    submitButton.textContent = "Next Question";


    let pickedOption;
    const correctOption = answerOptionList.querySelector("[data-correct-option]");

    // indentify picked option 
    answerOptions.forEach((answerOption) => {
        const answerOptionInput = answerOption.querySelector("input")
        if (answerOptionInput.checked) {
            pickedOption = answerOption;
        }
        answerOptionInput.setAttribute("disabled", true);
    })

    const isCorrect = pickedOption.hasAttribute("data-correct-option");
    revealOptionStatus(pickedOption, isCorrect, true);
    
    // show results of option selection
    if (isCorrect) {
        newQuiz.quizScore += 1;
        console.log(newQuiz.quizScore);
        srOnlyResultElement.textContent = "You got correct answer"
    } else {
        revealOptionStatus(correctOption, true, false)
        srOnlyResultElement.textContent = `You got incorrect answer. Correct option: ${correctOption.querySelector("[data-option-text]").textContent}`
    }
})


playAgainButton.addEventListener("click", (event) => {
    switchQuizFrame("menu");
})