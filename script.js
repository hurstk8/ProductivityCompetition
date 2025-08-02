// Data storage - using localStorage for persistence
class ProductivityTracker {
    constructor() {
        this.users = this.loadUsers();
        this.activities = this.loadActivities();
        this.activityTypes = {
            'workout': 10,
            'side-project': 15,
            'job-task': 8,
            'learning': 12,
            'reading': 5
        };
        
        this.init();
    }

    // Initialize the app
    init() {
        this.setupEventListeners();
        this.populateUserSelect();
        this.updateLeaderboard();
        this.updateRecentActivities();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Activity form submission
        document.getElementById('activityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.logActivity();
        });

        // Custom activity toggle
        document.getElementById('activityType').addEventListener('change', (e) => {
            const customGroup = document.getElementById('customActivityGroup');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
        });

        // Add user modal
        document.getElementById('addUserBtn').addEventListener('click', () => {
            document.getElementById('addUserModal').style.display = 'block';
        });

        // Add user form submission
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
        });

        // Modal close functionality
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('addUserModal').style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('addUserModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Load users from localStorage
    loadUsers() {
        const stored = localStorage.getItem('productivity_users');
        return stored ? JSON.parse(stored) : [];
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('productivity_users', JSON.stringify(this.users));
    }

    // Load activities from localStorage
    loadActivities() {
        const stored = localStorage.getItem('productivity_activities');
        return stored ? JSON.parse(stored) : [];
    }

    // Save activities to localStorage
    saveActivities() {
        localStorage.setItem('productivity_activities', JSON.stringify(this.activities));
    }

    // Add a new user
    addUser() {
        const nameInput = document.getElementById('newUserName');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Please enter a name');
            return;
        }
        
        if (this.users.find(user => user.name.toLowerCase() === name.toLowerCase())) {
            alert('User already exists');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            name: name,
            totalPoints: 0,
            totalNoahs: 0,
            totalNoahSum: 0
        };

        this.users.push(newUser);
        this.saveUsers();
        this.populateUserSelect();
        this.updateLeaderboard();

        // Close modal and reset form
        document.getElementById('addUserModal').style.display = 'none';
        nameInput.value = '';
    }

    // Populate user select dropdown
    populateUserSelect() {
        const select = document.getElementById('userSelect');
        select.innerHTML = '<option value="">Choose user...</option>';

        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }

    // Log a new activity
    logActivity() {
        const userSelect = document.getElementById('userSelect');
        const activityType = document.getElementById('activityType');
        const customActivity = document.getElementById('customActivity');
        const customPoints = document.getElementById('customPoints');
        const noahValue = document.getElementById('noahValue');
        const notes = document.getElementById('activityNotes');

        // Validation
        if (!userSelect.value) {
            alert('Please select a user');
            return;
        }

        if (!activityType.value) {
            alert('Please select an activity type');
            return;
        }

        if (!noahValue.value || parseFloat(noahValue.value) <= 0) {
            alert('Please enter a valid Noah value (greater than 0)');
            return;
        }

        // Get activity details
        let activityName, points;
        if (activityType.value === 'custom') {
            if (!customActivity.value || !customPoints.value) {
                alert('Please enter custom activity name and points');
                return;
            }
            activityName = customActivity.value;
            points = parseInt(customPoints.value);
        } else {
            activityName = this.getActivityName(activityType.value);
            points = this.activityTypes[activityType.value];
        }

        const noahs = parseFloat(noahValue.value);
        const noahSum = points * noahs;

        // Create activity object
        const activity = {
            id: Date.now().toString(),
            userId: userSelect.value,
            userName: this.users.find(u => u.id === userSelect.value).name,
            type: activityType.value,
            name: activityName,
            points: points,
            noahs: noahs,
            noahSum: noahSum,
            notes: notes.value.trim(),
            timestamp: new Date().toISOString()
        };

        // Add activity and update user stats
        this.activities.unshift(activity); // Add to beginning of array
        this.updateUserStats(userSelect.value, points, noahs, noahSum);

        // Save and update UI
        this.saveActivities();
        this.saveUsers();
        this.updateLeaderboard();
        this.updateRecentActivities();

        // Reset form
        document.getElementById('activityForm').reset();
        document.getElementById('customActivityGroup').style.display = 'none';

        // Show success message
        this.showSuccessMessage(`${activityName} logged! ${points} pts × ${noahs} Noahs = ${noahSum.toFixed(1)} NoahSum`);
    }

    // Get human-readable activity name
    getActivityName(type) {
        const names = {
            'workout': 'Workout',
            'side-project': 'Side Project Work',
            'job-task': 'Job Task',
            'learning': 'Learning/Study',
            'reading': 'Reading'
        };
        return names[type] || type;
    }

    // Update user's stats
    updateUserStats(userId, points, noahs, noahSum) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.totalPoints += points;
            user.totalNoahs = (user.totalNoahs || 0) + noahs;
            user.totalNoahSum = (user.totalNoahSum || 0) + noahSum;
        }
    }

    // Update leaderboard display
    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');

        if (this.users.length === 0) {
            leaderboardList.innerHTML = '<div class="empty-state"><p>No users yet!</p><p>Add some users to get started.</p></div>';
            return;
        }

        // Sort users by NoahSum (descending)
        const sortedUsers = [...this.users].sort((a, b) => (b.totalNoahSum || 0) - (a.totalNoahSum || 0));

        leaderboardList.innerHTML = '';
        sortedUsers.forEach((user, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`;

            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const noahSum = user.totalNoahSum || 0;
            const totalPoints = user.totalPoints || 0;
            const totalNoahs = user.totalNoahs || 0;

            item.innerHTML = `
                <div class="user-info">
                    <span class="rank">${rankEmoji}</span>
                    <span class="user-name">${user.name}</span>
                    <div class="breakdown">${totalPoints} pts × ${totalNoahs.toFixed(1)} Noahs</div>
                </div>
                <div class="noah-sum">${noahSum.toFixed(1)} NoahSum</div>
            `;
            leaderboardList.appendChild(item);
        });
    }

    // Update recent activities display
    updateRecentActivities() {
        const activitiesList = document.getElementById('recentActivitiesList');

        if (this.activities.length === 0) {
            activitiesList.innerHTML = '<div class="empty-state"><p>No activities logged yet!</p><p>Start tracking your productivity!</p></div>';
            return;
        }

        // Show last 10 activities
        const recentActivities = this.activities.slice(0, 10);

        activitiesList.innerHTML = '';
        recentActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';

            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            const noahs = activity.noahs || 0;
            const noahSum = activity.noahSum || (activity.points * noahs);

            item.innerHTML = `
                <div class="activity-header">
                    <span class="activity-type">${activity.name}</span>
                    <div>
                        <span class="activity-points">+${activity.points}</span>
                        <span class="activity-noah">${noahs}N</span>
                        <span class="activity-noahsum">${noahSum.toFixed(1)}NS</span>
                    </div>
                </div>
                <div class="activity-user">by ${activity.userName}</div>
                ${activity.notes ? `<div class="activity-notes">${activity.notes}</div>` : ''}
                <div class="activity-time">${timeAgo}</div>
            `;
            activitiesList.appendChild(item);
        });
    }

    // Get human-readable time ago
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Show success message
    showSuccessMessage(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            z-index: 1001;
            font-weight: 500;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProductivityTracker();
});