       
        let assignments = [];
        let studySessions = [];
        let focusSessions = [];
        let subjects = [];
        let currentTimer = null;
        let currentTime = 0;
        let isRunning = false;


        const quotes = [
            "The future belongs to those who believe in the beauty of their dreams.",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "Education is the most powerful weapon which you can use to change the world.",
            "The only way to do great work is to love what you do.",
            "Don't watch the clock; do what it does. Keep going.",
            "The expert in anything was once a beginner.",
            "Your limitation—it's only your imagination.",
            "Push yourself, because no one else is going to do it for you.",
            "Great things never come from comfort zones.",
            "Dream it. Wish it. Do it."
        ];

        document.addEventListener('DOMContentLoaded', function() {
            updateStats();
            displayAssignments();
            displayStudySessions();
            displayFocusHistory();
            displaySubjects();
            generateStudyRecommendations();
            generateWeeklySchedule();
            updateSubjectDropdowns();
            setCurrentDateTime();
        });

        
        function showTab(tabName) {
            const tabs = document.querySelectorAll('.tab-content');
            const navTabs = document.querySelectorAll('.nav-tab');
            
            tabs.forEach(tab => tab.classList.remove('active'));
            navTabs.forEach(tab => tab.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        
        document.getElementById('subjectForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subject = {
                id: Date.now(),
                name: document.getElementById('subjectName').value,
                difficulty: document.getElementById('subjectDifficulty').value,
                priority: document.getElementById('subjectPriority').value,
                weeklyHours: parseInt(document.getElementById('subjectHours').value),
                grade: document.getElementById('subjectGrade').value,
                notes: document.getElementById('subjectNotes').value,
                hoursSpent: 0,
                dateAdded: new Date().toISOString()
            };
            
            subjects.push(subject);
            showNotification('Subject priority added successfully!');
            this.reset();
            displaySubjects();
            generateStudyRecommendations();
            generateWeeklySchedule();
        });

        function displaySubjects() {
            const container = document.getElementById('subjectsList');
            container.innerHTML = '';
            
            const sortedSubjects = subjects.sort((a, b) => {
                const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            
            sortedSubjects.forEach(subject => {
                const progressPercentage = Math.min((subject.hoursSpent / subject.weeklyHours) * 100, 100);
                
                const div = document.createElement('div');
                div.className = `subject-card ${subject.priority}`;
                div.innerHTML = `
                    <div class="priority-indicator"></div>
                    <div class="difficulty-badge difficulty-${subject.difficulty}">
                        ${subject.difficulty.replace('-', ' ').toUpperCase()}
                    </div>
                    <div style="margin-right: 60px;">
                        <h4>${subject.name}</h4>
                        <p><strong>Priority:</strong> ${subject.priority.toUpperCase()}
                            <span class="grade-badge grade-${subject.grade}">Grade: ${subject.grade}</span>
                        </p>
                        <p><strong>Weekly Goal:</strong> ${subject.weeklyHours} hours</p>
                        <p><strong>Progress:</strong> ${subject.hoursSpent}/${subject.weeklyHours} hours (${Math.round(progressPercentage)}%)</p>
                        <div class="progress-bar" style="margin: 10px 0;">
                            <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
                        </div>

                        ${subject.notes ? `<p><strong>Notes:</strong> ${subject.notes}</p>` : ''}
                        <div style="margin-top: 10px;">
                            <button class="btn" onclick="addStudyTime(${subject.id})"><i class="fas fa-clock"></i> Add Study Time</button>
                            <button class="btn btn-danger" onclick="deleteSubject(${subject.id})" style="margin-left: 10px;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function addStudyTime(subjectId) {
            const hours = prompt('How many hours did you study this subject?');
            if (hours && !isNaN(hours) && hours > 0) {
                const subject = subjects.find(s => s.id === subjectId);
                if (subject) {
                    subject.hoursSpent += parseFloat(hours);
                    showNotification(`Added ${hours} hours to ${subject.name}!`);
                    displaySubjects();
                    generateStudyRecommendations();
                }
            }
        }

        function deleteSubject(id) {
            subjects = subjects.filter(s => s.id !== id);
            showNotification('Subject deleted');
            displaySubjects();
            generateStudyRecommendations();
            generateWeeklySchedule();
        }

        function generateStudyRecommendations() {
            const container = document.getElementById('studyRecommendations');
            container.innerHTML = '';
            
            if (subjects.length === 0) {
                container.innerHTML = '<p>Add subjects to get personalized study recommendations!</p>';
                return;
            }
            
            const recommendations = [];
            
            subjects.forEach(subject => {
                const progressPercentage = (subject.hoursSpent / subject.weeklyHours) * 100;
                const priorityScore = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }[subject.priority];
                const difficultyScore = { 'very-hard': 4, 'hard': 3, 'medium': 2, 'easy': 1 }[subject.difficulty];
                const gradeScore = { 'F': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'unknown': 3 }[subject.grade];
                
                let recommendation = '';
                let urgency = 'medium';
                
                if (progressPercentage < 50 && (priorityScore >= 3 || gradeScore >= 4)) {
                    recommendation = `<i class="fas fa-exclamation-triangle"></i> URGENT: ${subject.name} needs immediate attention! You're behind on your weekly goal and this subject is ${subject.priority} priority.`;
                    urgency = 'high';
                } else if (subject.grade === 'F' || subject.grade === 'D') {
                    recommendation = `<i class="fas fa-book"></i> FOCUS: ${subject.name} requires extra study time. Current grade: ${subject.grade}. Consider scheduling 2-3 focused sessions this week.`;
                    urgency = 'high';
                } else if (difficultyScore >= 3 && progressPercentage < 75) {
                    recommendation = `<i class="fas fa-dumbbell"></i> CHALLENGE: ${subject.name} is marked as ${subject.difficulty.replace('-', ' ')}. Consider breaking study sessions into smaller, focused chunks.`;
                    urgency = 'medium';
                } else if (progressPercentage >= 100) {
                    recommendation = `<i class="fas fa-trophy"></i> EXCELLENT: You've met your weekly goal for ${subject.name}! Consider reviewing or helping others with this subject.`;
                    urgency = 'low';
                } else if (progressPercentage >= 75) {
                    recommendation = `<i class="fas fa-check-circle"></i> ON TRACK: ${subject.name} is progressing well. You're ${Math.round(progressPercentage)}% towards your weekly goal.`;
                    urgency = 'low';
                }
                
                if (recommendation) {
                    recommendations.push({ text: recommendation, urgency, subject: subject.name });
                }
            });
            
            
            recommendations.sort((a, b) => {
                const urgencyOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
            });
            
            recommendations.forEach(rec => {
                const div = document.createElement('div');
                div.className = 'study-recommendation';
                div.innerHTML = `<p>${rec.text}</p>`;
                container.appendChild(div);
            });
        }

        function generateWeeklySchedule() {
            const container = document.getElementById('weeklySchedule');
            container.innerHTML = '';
            
            if (subjects.length === 0) {
                container.innerHTML = '<p>Add subjects to generate your weekly study schedule!</p>';
                return;
            }
            
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const totalHours = subjects.reduce((sum, subject) => sum + subject.weeklyHours, 0);
            
            days.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'schedule-day';
                
                const dailyHours = Math.ceil(totalHours / 7);
                let remainingHours = dailyHours;
                let daySubjects = [];
                
              
                const prioritizedSubjects = subjects
                    .map(subject => {
                        const deficit = subject.weeklyHours - subject.hoursSpent;
                        const priorityScore = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }[subject.priority];
                        return { ...subject, deficit, priorityScore };
                    })
                    .sort((a, b) => (b.priorityScore * b.deficit) - (a.priorityScore * a.deficit))
                    .slice(0, 3); // Max 3 subjects per day
                
                prioritizedSubjects.forEach(subject => {
                    if (remainingHours > 0 && subject.deficit > 0) {
                        const hours = Math.min(remainingHours, Math.ceil(subject.weeklyHours / 5));
                        if (hours > 0) {
                            daySubjects.push({ name: subject.name, hours });
                            remainingHours -= hours;
                        }
                    }
                });
                
                dayDiv.innerHTML = `
                    <h4>${day}</h4>
                    <div>
                        ${daySubjects.map(subject => 
                            `<span class="schedule-subject">${subject.name} (${subject.hours}h)</span>`
                        ).join('')}
                        ${daySubjects.length === 0 ? '<span style="color: #666;">Rest day or catch-up</span>' : ''}
                    </div>
                `;
                
                container.appendChild(dayDiv);
            });
        }

     
        document.getElementById('assignmentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subjectSelect = document.getElementById('assignmentSubject');
            const subjectOther = document.getElementById('assignmentSubjectOther');
            const subjectValue = subjectSelect.value === 'other' ? subjectOther.value : subjectSelect.value;
            
            const assignment = {
                id: Date.now(),
                title: document.getElementById('assignmentTitle').value,
                subject: subjectValue,
                dueDate: document.getElementById('assignmentDueDate').value,
                priority: document.getElementById('assignmentPriority').value,
                description: document.getElementById('assignmentDescription').value,
                completed: false,
                dateAdded: new Date().toISOString()
            };
            
            assignments.push(assignment);
            showNotification('Assignment added successfully!');
            this.reset();
            document.getElementById('assignmentSubjectOther').style.display = 'none';
            displayAssignments();
            updateStats();
            updateSubjectDropdowns();
        });

       
        document.getElementById('assignmentSubject').addEventListener('change', function() {
            const otherInput = document.getElementById('assignmentSubjectOther');
            if (this.value === 'other') {
                otherInput.style.display = 'block';
                otherInput.required = true;
            } else {
                otherInput.style.display = 'none';
                otherInput.required = false;
                otherInput.value = '';
            }
        });

        document.getElementById('sessionSubject').addEventListener('change', function() {
            const otherInput = document.getElementById('sessionSubjectOther');
            if (this.value === 'other') {
                otherInput.style.display = 'block';
                otherInput.required = true;
            } else {
                otherInput.style.display = 'none';
                otherInput.required = false;
                otherInput.value = '';
            }
        });

        function updateSubjectDropdowns() {
            const assignmentSelect = document.getElementById('assignmentSubject');
            const sessionSelect = document.getElementById('sessionSubject');
            
           
            const allSubjects = new Set();
            subjects.forEach(s => allSubjects.add(s.name));
            assignments.forEach(a => allSubjects.add(a.subject));
            studySessions.forEach(s => allSubjects.add(s.subject));
            
          
            [assignmentSelect, sessionSelect].forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Select Subject</option>';
                
                Array.from(allSubjects).sort().forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    select.appendChild(option);
                });
                
                const otherOption = document.createElement('option');
                otherOption.value = 'other';
                otherOption.textContent = 'Other/New Subject';
                select.appendChild(otherOption);
                
                select.value = currentValue;
            });
        }

        function displayAssignments() {
            const container = document.getElementById('assignmentsList');
            container.innerHTML = '';
            
            const sortedAssignments = assignments.sort((a, b) => {
                if (a.completed !== b.completed) return a.completed - b.completed;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            
            sortedAssignments.forEach(assignment => {
                const dueDate = new Date(assignment.dueDate);
                const today = new Date();
                const isOverdue = dueDate < today && !assignment.completed;
                
                const div = document.createElement('div');
                div.className = `assignment-item priority-${assignment.priority} ${assignment.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
                div.innerHTML = `
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div style="flex: 1;">
                            <h4>${assignment.title}</h4>
                            <p><strong>Subject:</strong> ${assignment.subject}</p>
                            <p><strong>Due:</strong> ${formatDate(assignment.dueDate)} ${isOverdue ? '(Overdue!)' : ''}</p>
                            <p><strong>Priority:</strong> ${assignment.priority.toUpperCase()}</p>
                            ${assignment.description ? `<p><strong>Description:</strong> ${assignment.description}</p>` : ''}
                        </div>
                        <div style="margin-left: 20px;">
                            <button class="btn ${assignment.completed ? 'btn-secondary' : ''}" onclick="toggleAssignment(${assignment.id})">
                                ${assignment.completed ? '<i class="fas fa-undo"></i> Undo' : '<i class="fas fa-check"></i> Complete'}
                            </button>
                            <button class="btn btn-danger" onclick="deleteAssignment(${assignment.id})" style="margin-left: 10px;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function toggleAssignment(id) {
            const assignment = assignments.find(a => a.id === id);
            if (assignment) {
                assignment.completed = !assignment.completed;
                if (assignment.completed) {
                    showNotification('Assignment completed! <i class="fas fa-trophy"></i>');
                }
                displayAssignments();
                updateStats();
            }
        }

        function deleteAssignment(id) {
            assignments = assignments.filter(a => a.id !== id);
            showNotification('Assignment deleted');
            displayAssignments();
            updateStats();
        }

       
        document.getElementById('studyForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subjectSelect = document.getElementById('sessionSubject');
            const subjectOther = document.getElementById('sessionSubjectOther');
            const subjectValue = subjectSelect.value === 'other' ? subjectOther.value : subjectSelect.value;
            
            const session = {
                id: Date.now(),
                title: document.getElementById('sessionTitle').value,
                subject: subjectValue,
                type: document.getElementById('sessionType').value,
                duration: parseInt(document.getElementById('sessionDuration').value),
                date: document.getElementById('sessionDate').value,
                time: document.getElementById('sessionTime').value,
                completed: false
            };
            
            studySessions.push(session);
            showNotification('Study session scheduled!');
            this.reset();
            document.getElementById('sessionSubjectOther').style.display = 'none';
            displayStudySessions();
            updateSubjectDropdowns();
        });

        function displayStudySessions() {
            const container = document.getElementById('sessionsList');
            container.innerHTML = '';
            
            const sortedSessions = studySessions.sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateA - dateB;
            });
            
            sortedSessions.forEach(session => {
                const div = document.createElement('div');
                div.className = `session-item ${session.completed ? 'completed' : ''}`;
                div.innerHTML = `
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div style="flex: 1;">
                            <div>
                                <span class="session-type session-${session.type}">${session.type.toUpperCase()}</span>
                                <strong>${session.title}</strong>
                            </div>
                            <p><strong>Subject:</strong> ${session.subject}</p>
                            <p><strong>Duration:</strong> ${session.duration} minutes</p>
                            <p><strong>Scheduled:</strong> ${formatDate(session.date)} at ${session.time}</p>
                        </div>
                        <div style="margin-left: 20px;">
                            <button class="btn ${session.completed ? 'btn-secondary' : ''}" onclick="toggleSession(${session.id})">
                                ${session.completed ? '<i class="fas fa-undo"></i> Undo' : '<i class="fas fa-check"></i> Complete'}
                            </button>
                            <button class="btn btn-danger" onclick="deleteSession(${session.id})" style="margin-left: 10px;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function toggleSession(id) {
            const session = studySessions.find(s => s.id === id);
            if (session) {
                session.completed = !session.completed;
                if (session.completed) {
                    showNotification('Study session completed! <i class="fas fa-graduation-cap"></i>');
                    
                    // Add hours to corresponding subject if it exists
                    const subject = subjects.find(s => s.name === session.subject);
                    if (subject) {
                        subject.hoursSpent += session.duration / 60; // Convert minutes to hours
                        displaySubjects();
                        generateStudyRecommendations();
                    }
                }
                displayStudySessions();
            }
        }

        function deleteSession(id) {
            studySessions = studySessions.filter(s => s.id !== id);
            showNotification('Study session deleted');
            displayStudySessions();
        }

        // Focus Timer
        function updateTimer() {
            const duration = parseInt(document.getElementById('timerDuration').value);
            if (!isRunning) {
                currentTime = duration * 60;
                updateTimerDisplay();
                updateProgressBar();
            }
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(currentTime / 60);
            const seconds = currentTime % 60;
            document.getElementById('timerDisplay').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function updateProgressBar() {
            const totalTime = parseInt(document.getElementById('timerDuration').value) * 60;
            const progress = ((totalTime - currentTime) / totalTime) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }

        function startTimer() {
            if (!isRunning) {
                isRunning = true;
                currentTimer = setInterval(() => {
                    currentTime--;
                    updateTimerDisplay();
                    updateProgressBar();
                    
                    if (currentTime <= 0) {
                        clearInterval(currentTimer);
                        isRunning = false;
                        showNotification('Focus session completed! Take a break. <i class="fas fa-trophy"></i>');
                        
                        // Add to focus history
                        const duration = parseInt(document.getElementById('timerDuration').value);
                        const focusSession = {
                            duration: duration,
                            date: new Date().toISOString(),
                            completed: true,
                            subject: prompt('Which subject did you study? (optional)') || 'General Study'
                        };
                        
                        focusSessions.push(focusSession);
                        
                        // Add hours to corresponding subject if it exists
                        const subject = subjects.find(s => s.name === focusSession.subject);
                        if (subject) {
                            subject.hoursSpent += duration / 60; // Convert minutes to hours
                            displaySubjects();
                            generateStudyRecommendations();
                        }
                        
                        displayFocusHistory();
                        updateStats();
                        
                        // Reset timer
                        updateTimer();
                    }
                }, 1000);
            }
        }

        function pauseTimer() {
            if (isRunning) {
                clearInterval(currentTimer);
                isRunning = false;
                showNotification('Timer paused');
            }
        }

        function resetTimer() {
            clearInterval(currentTimer);
            isRunning = false;
            updateTimer();
            showNotification('Timer reset');
        }

        function displayFocusHistory() {
            const container = document.getElementById('focusHistory');
            const today = new Date().toDateString();
            const todaySessions = focusSessions.filter(session => 
                new Date(session.date).toDateString() === today
            );
            
            if (todaySessions.length > 0) {
                container.innerHTML = `
                    <p>Sessions completed today: ${todaySessions.length}</p>
                    <div style="margin-top: 10px;">
                        ${todaySessions.map(session => `
                            <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #667eea;border-bottom: solid #667eea;">
                                <strong>${session.duration} min</strong> - ${session.subject || 'General Study'}
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = '<p>No focus sessions completed today yet.</p>';
            }
        }

      
        function getNewQuote() {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            document.getElementById('motivationQuote').textContent = randomQuote;
            document.getElementById('motivationQuote').classList.add('fade-in');
            setTimeout(() => {
                document.getElementById('motivationQuote').classList.remove('fade-in');
            }, 500);
        }

      
        function updateStats() {
            document.getElementById('totalAssignments').textContent = assignments.length;
            document.getElementById('completedAssignments').textContent = 
                assignments.filter(a => a.completed).length;
            
            const today = new Date().toDateString();
            const todayFocusTime = focusSessions
                .filter(session => new Date(session.date).toDateString() === today)
                .reduce((total, session) => total + session.duration, 0);
            
            const hours = Math.floor(todayFocusTime / 60);
            const minutes = todayFocusTime % 60;
            document.getElementById('focusTimeToday').textContent = `${hours}h ${minutes}m`;
            
            
            const streak = Math.min(focusSessions.length, 7);
            document.getElementById('studyStreak').textContent = streak;
            
            
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            
            const weeklyCompleted = assignments.filter(a => 
                a.completed && new Date(a.dateAdded) >= weekStart
            ).length;
            document.getElementById('weeklyAssignments').textContent = weeklyCompleted;
            
            const weeklyFocus = focusSessions
                .filter(session => new Date(session.date) >= weekStart)
                .reduce((total, session) => total + session.duration, 0);
            document.getElementById('weeklyFocusTime').textContent = Math.floor(weeklyFocus / 60) + 'h';
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        function setCurrentDateTime() {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
            
            document.getElementById('sessionDate').value = dateStr;
            document.getElementById('sessionTime').value = timeStr;
        }

        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
