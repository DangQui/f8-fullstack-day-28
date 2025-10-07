async function sendRequest(method, url) {
  try {
    const response = await fetch(url, { method });

    if (response.ok) {
      const data = await response.json(); // json -> array
      return data;
    } else {
      if (response.status === 404)
        throw new Error("Không tìm thấy dữ liệu (404)");
      if (response.status >= 500) throw new Error("Lỗi server (500)");
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    if (error.name === "TypeError" || error.message.includes("fetch")) {
      throw new Error("Lỗi mạng: Không thể kết nối");
    }
    throw error;
  }
}

// ===== CHỨC NĂNG 1: USER PROFILE CARD (ASYNC/AWAIT, KHÔNG RETRY) =====
const userIdInput = document.querySelector("#user-id-input");
const searchUserBtn = document.querySelector("#search-user-btn");
const userLoading = document.querySelector("#user-loading");
const userError = document.querySelector("#user-error");
const userErrorText = document.querySelector("#user-error-text");
const userProfileCard = document.querySelector("#user-profile-card");
const userAvatar = document.querySelector("#user-avatar");
const userName = document.querySelector("#user-name");
const userEmail = document.querySelector("#user-email");
const userPhone = document.querySelector("#user-phone");
const userWebsite = document.querySelector("#user-website");
const userCompany = document.querySelector("#user-company");
const userAddress = document.querySelector("#user-address");

// Hàm show loading
function showUserLoading() {
  userLoading.style.display = "block";
  userError.style.display = "none";
  userProfileCard.style.display = "none";
}

// Hàm show error
function showUserError(message) {
  userErrorText.textContent = message;
  userError.style.display = "block";
  userProfileCard.style.display = "none";
}

// Hàm update profile
function updateUserProfile(user) {
  userAvatar.textContent = user.name.charAt(0).toUpperCase();
  userName.textContent = user.name;
  userEmail.textContent = user.email;
  userPhone.textContent = user.phone;
  userWebsite.textContent = user.website;
  userCompany.textContent = user.company.name;
  userAddress.textContent = `${user.address.street}, ${user.address.city}`;
  userProfileCard.style.display = "block";
  userError.style.display = "none";
}

// Hàm handle search
async function handleSearchUser() {
  const id = parseInt(userIdInput.value);
  if (isNaN(id) || id < 1 || id > 10) {
    showUserError("ID phải nhập từ 1 đến 10");
    return;
  }

  showUserLoading();

  try {
    const user = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/users/${id}`
    );

    userLoading.style.display = "none";
    updateUserProfile(user);
  } catch (error) {
    userLoading.style.display = "none";
    let msg = error.message;
    if (msg.includes("404")) msg = "User không tồn tại!";
    else if (msg.includes("500")) msg = "Lỗi server, thử lại sau!";
    else if (msg.includes("mạng")) msg = "Kiểm tra kết nối!";
    showUserError(msg);
  }
}

// ===== CHỨC NĂNG 2: POSTS VỚI COMMENT
const postsLoading = document.querySelector("#posts-loading");
const postsError = document.querySelector("#posts-error");
const postsErrorText = document.querySelector("#posts-error-text");
const postsContainer = document.querySelector("#posts-container");
const loadMoreBtn = document.querySelector("#load-more-posts-btn");

let loadedPostsCount = 0;

// Hàm show loading
function showPostsLoading() {
  postsLoading.style.display = "block";
  postsError.style.display = "none";
  loadMoreBtn.style.display = "none";
}

// Hàm show error
function showPostsError(message) {
  postsErrorText.textContent = message;
  postsError.style.display = "block";
  loadMoreBtn.style.display = "block";
}

// Hàm render posts
function renderPosts(posts, append = false) {
  if (!append) postsContainer.innerHTML = "";
  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.className = "post-item";
    postElement.setAttribute("data-post-id", post.id);
    postElement.innerHTML = `
            <h4 class="post-title">${post.title}</h4>
            <p class="post-body">${post.body}</p>
            <p class="post-author">Tác giả: <span class="author-name" data-user-id="${post.userId}">Đang tải...</span></p>
            <button class="show-comments-btn" data-post-id=${post.id}>Xem comments</button>
            <div class="comments-container" data-post-id=${post.id} style="display: none;"></div>
        `;
    postsContainer.appendChild(postElement);
  });
}

// Hàm load posts
async function loadPosts(start = 0) {
  showPostsLoading();

  try {
    const posts = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/posts?_start=${start}&_limit=5`
    );

    postsLoading.style.display = "none";
    renderPosts(posts, start > 0);
    loadedPostsCount += posts.length;

    if (loadedPostsCount < 100) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  } catch (error) {
    postsContainer.style.display = "none";
    let msg = error.message;
    if (msg.includes("500")) msg = "Lỗi server posts, thử lại!";
    else if (msg.includes("mạng")) msg = "Kiểm tra kết nối!";
    showPostsError(msg);
    loadMoreBtn.style.display = "block";
  }
}

// Hàm initial load
function loadInitialPosts() {
  loadedPostsCount = 0;
  loadPosts(0);
}

// Hàm load more
function loadMorePosts() {
  loadPosts(loadedPostsCount);
}

// Hàm handle show comment
async function handleShowComments(e) {
  // Kiểm tra xem nếu không có class "show-comments-btn" trong phần tử DOM được target
  if (!e.target.classList.contains("show-comments-btn")) return;

  const postId = parseInt(e.target.dataset.postId); // Lấy id từ data-set => chuyển sang camelCase
  const postElement = e.target.closest(".post-item"); // Tìm phần tử tra gần nhất có css-selector
  const authorSpan = postElement.querySelector(".author-name");
  const commentsContainer = postElement.querySelector(".comments-container");

  if (commentsContainer.style.display === "block") {
    commentsContainer.style.display = "none";
    e.target.textContent = "Xem comments";
    return;
  }

  commentsContainer.innerHTML = "<p>Đang tải comments...</p>";
  commentsContainer.style.display = "block";
  e.target.textContent = "Ẩn comments";

  const userId = parseInt(authorSpan.dataset.userId);

  try {
    const user = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );
    authorSpan.textContent = user.name;

    const comments = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/posts/${postId}/comments`
    );

    commentsContainer.innerHTML = "";
    comments.forEach((comment) => {
      const commentElement = document.createElement("div");
      commentElement.className = "comment-item";
      commentElement.innerHTML = `
            <div class="comment-author">${comment.name}</div>
            <div class="comment-email">${comment.email}/div>
            <div class="comment-body">${comment.body}</div>
        `;
    });
  } catch (error) {
    commentsContainer.innerHTML = `<p>Lỗi: ${
      error.message.includes("404") ? "Không có comments!" : error.message
    }</p>`;
  }
}

// Setup events.
function setupPostsEventListeners() {
  postsContainer.addEventListener("click", handleShowComments);
  loadMoreBtn.addEventListener("click", loadMorePosts);
}

// ===== CHỨC NĂNG 3: TODO LIST VỚI FILTER (ASYNC/AWAIT) =====
// Elements.
const todoUserIdInput = document.querySelector("#todo-user-id-input");
const loadTodosBtn = document.querySelector("#load-todos-btn");
const todoFilters = document.querySelectorAll(".filter-btn");
const todoList = document.querySelector("#todo-list");
const todosLoading = document.querySelector("#todos-loading");
const todosError = document.querySelector("#todos-error");
const todosErrorText = document.querySelector("#todos-error-text");
const totalTodosEl = document.querySelector("#total-todos");
const completedTodosEl = document.querySelector("#completed-todos");
const incompleteTodosEl = document.querySelector("#incomplete-todos");

// Biến global.
let allTodos = [];

// Hàm show loading.
function showTodosLoading() {
  todosLoading.style.display = "block";
  todosError.style.display = "none";
  todoList.innerHTML = "";
}

// Hàm show error.
function showTodosError(message) {
  todosErrorText.textContent = message;
  todosError.style.display = "block";
}

// Hàm render todos.
function renderTodos(todosToRender) {
  todoList.innerHTML = "";
  todosToRender.forEach((todo) => {
    const todoEl = document.createElement("div");
    todoEl.className = `todo-item ${
      todo.completed ? "completed" : "incomplete"
    }`;
    todoEl.setAttribute("data-todo-id", todo.id);
    todoEl.setAttribute("data-completed", todo.completed);
    todoEl.innerHTML = `
      <div class="todo-checkbox">${todo.completed ? "✅" : "⏳"}</div>
      <div class="todo-text">${todo.title}</div>
    `;
    todoList.appendChild(todoEl);
  });
}

// Hàm update stats.
function updateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const incomplete = total - completed;
  totalTodosEl.textContent = total;
  completedTodosEl.textContent = completed;
  incompleteTodosEl.textContent = incomplete;
}

// Hàm handle load todos (async).
async function handleLoadTodos() {
  const id = parseInt(todoUserIdInput.value);
  if (isNaN(id) || id < 1 || id > 10) {
    showTodosError("ID phải từ 1 đến 10!");
    return;
  }

  showTodosLoading();

  try {
    // Await sendRequest trực tiếp.
    const todos = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/users/${id}/todos`
    );

    todosLoading.style.display = "none";
    allTodos = todos;
    renderTodos(allTodos);
    updateStats(allTodos);
  } catch (error) {
    // 3.3: Specific error.
    todosLoading.style.display = "none";
    let msg = error.message;
    if (msg.includes("404")) msg = "User không có todos!";
    else if (msg.includes("500")) msg = "Lỗi server todos!";
    else if (msg.includes("mạng")) msg = "Kiểm tra kết nối!";
    showTodosError(msg);
  }
}

// Hàm handle filter.
function handleFilterTodos(e) {
  todoFilters.forEach((btn) => btn.classList.remove("active"));
  e.target.classList.add("active");
  const filter = e.target.dataset.filter;
  let filtered = [];
  if (filter === "all") filtered = allTodos;
  else if (filter === "completed")
    filtered = allTodos.filter((t) => t.completed);
  else filtered = allTodos.filter((t) => !t.completed);
  renderTodos(filtered);
}

// ===== EVENT =====
// User
searchUserBtn.addEventListener("click", handleSearchUser);

// Posts.
loadInitialPosts();
setupPostsEventListeners();

// Todos.
loadTodosBtn.addEventListener("click", handleLoadTodos);
todoFilters.forEach((btn) => btn.addEventListener("click", handleFilterTodos));
document.querySelector("#filter-all").classList.add("active");
