// Fetch questions, topics, and responses from JSON files
Promise.all([
    fetch('questions.json').then(response => response.json()),
    fetch('topics.json').then(response => response.json()),
    fetch('response.json').then(response => response.json())
])
.then(([questions, topics, responses]) => {
    // Get the container where questions will be displayed
    const quizContainer = document.getElementById('quiz-container');

    // Initialize correctness ratios and current question index
    const correctnessRatios = JSON.parse(sessionStorage.getItem('correctnessRatios')) || {};
    let currentQuestionIndex = JSON.parse(sessionStorage.getItem('currentQuestionIndex')) || 0;
    
        function displayScore() {
        // At the end of the quiz
        quizContainer.innerHTML = '<p>Quiz completed!</p>';

        // Iterate over the topics array
        for (let topic of topics) {
            // Get the correctness ratio for the topic, or default to { correct: 0, total: 0 }
            const correctnessRatio = correctnessRatios[topic.TopicID] || { correct: 0, total: 0 };

            // Calculate the correctness percentage
            const percentage = (correctnessRatio.correct / correctnessRatio.total) * 100 || 0;

            // Create a progress bar
            const progressBar = `
                <div class="topic-progress">
                    <span>${topic.Topic}</span>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage.toFixed(2)}%</div>
                    </div>
                </div>
            `;

            // Append the progress bar to the quiz container
            quizContainer.innerHTML += progressBar;
        }

        console.log(responses); // Log the responses to the console
    }

    function displayQuestion(index) {
        // Clear the quiz container
        quizContainer.innerHTML = '';

        // Get the question, its topic, and its response
        const question = questions[index];
        const topic = topics.find(topic => topic.TopicID === question.TopicID);
        const response = responses.find(response => response.QuestionID === question.QuestionID);

        // Initialize correctness ratio for the topic if it doesn't exist
        if (!correctnessRatios[topic.TopicID]) {
            correctnessRatios[topic.TopicID] = { correct: 0, total: 0 };
        }

        // Create HTML for the question, its topic, and its options
        quizContainer.innerHTML = `
            <div class="card-body">
                <h4 class="card-title">${topic.Topic}</h4>
                <h5 class="card-subtitle mb-2">${question.Question}</h5>
                <form id="answerForm">
                    ${JSON.parse(question.Options).map((option, i) => `
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="answer" value="${option}" ${option == response.Response ? 'checked' : ''}>
                            <label class="form-check-label">${option}</label>
                        </div>`).join('')}
                    <button type="submit" class="btn btn-primary mt-3">Next</button>
                </form>
            </div>
        `;

        // Add event listener to the form to go to the next question when submitted
        document.getElementById('answerForm').addEventListener('submit', (event) => {
            event.preventDefault();

            // Update the response for the current question
            const selectedOption = document.querySelector('input[name="answer"]:checked').value;
            response.Response = selectedOption;

            // Update correctness ratio
            correctnessRatios[topic.TopicID].total++;
            if (selectedOption == question.Answer) {
                correctnessRatios[topic.TopicID].correct++;
                console.log('Correct!');
            }
            else {
                console.log('Incorrect!');
            }
            sessionStorage.setItem('correctnessRatios', JSON.stringify(correctnessRatios));

            console.log(correctnessRatios[topic.TopicID]);

            // If all questions in a topic are answered incorrectly, end the quiz
            if (correctnessRatios[topic.TopicID].total === questions.filter(q => q.TopicID === topic.TopicID).length && correctnessRatios[topic.TopicID].correct === 0) {
                displayScore();
                return;
            }


            // Determine the next question
            let nextQuestion = questions.find(q => q.TopicID === question.TopicID && q.QuestionID > question.QuestionID);

            if (!nextQuestion || (correctnessRatios[topic.TopicID].total >= 3 && correctnessRatios[topic.TopicID].correct / correctnessRatios[topic.TopicID].total > 0.7)) {
                // Move to the next topic
                
                const nextTopic = topics.find(t => t.ClassID === topic.ClassID && t.TopicID > topic.TopicID);
                if (nextTopic) {
                    console.log('Moving to the next topic');
                    nextQuestion = questions.find(q => q.TopicID === nextTopic.TopicID);
                } else {
                    // Move to the next class
                    console.log('Moving to the next class');
                    const nextClassTopic = topics.find(t => t.ClassID > topic.ClassID);
                    if (nextClassTopic) {
                        nextQuestion = questions.find(q => q.TopicID === nextClassTopic.TopicID);
                        console.log(nextQuestion);
                    } else {
                        displayScore();
                        return;
                    }
                }
            }

            if (nextQuestion) {
                currentQuestionIndex = questions.indexOf(nextQuestion);
                sessionStorage.setItem('currentQuestionIndex', JSON.stringify(currentQuestionIndex));
                displayQuestion(currentQuestionIndex);
            } else {
                displayScore();
            }
        });
    }

    // Display the first question
    displayQuestion(currentQuestionIndex);
})
.catch(error => console.error('Error fetching questions, topics, or responses:', error));