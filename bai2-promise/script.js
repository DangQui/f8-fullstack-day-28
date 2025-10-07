function sendRequest(method, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    xhr.onload = function () {
      if (this.status >= 200 && this.status <= 400) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (error) {
          // Lỗi JSON
          reject(new Error("Invalid JSON response"));
        }
      } else {
        reject(new Error(`HTTP ${this.status}: ${this.statusText}`));
      }
    };

    // Xử lý onerror (Network fail)
    xhr.onerror = function () {
      reject(new Error("NetWork error: Không thể kết nối!"));
    };

    xhr.send();
  });
}

// Hàm xử lý tự động retry 1 (maxRetries = 1) lần sau 2s nếu fail
// Hiển thị số lầm retry trong loading div (param showRetryFn để update UI)
// Sử dụng cho tất cả API calls handle error + retry
function withRetry(sendRequest, maxRetries = 1, showRetryFn = null) {
  return function (...arg) {
    return sendRequest(...arg).catch((error) => {
      if (maxRetries > 0) {
        if (showRetryFn)
          showRetryFn(`Đang retry lần ${2 - maxRetries}/${1} sau 2 giây...`);

        return new Promise((resolve) => setTimeout(resolve, 2000)).then(() =>
          withRetry(sendRequest, maxRetries - 1, showRetryFn)(...arg)
        );
      } else {
        throw error;
      }
    });
  };
}

// === CHỨC NĂNG 1 ===
const userIdInput = document.querySelector("#user-id-input");
const searchUserBtn = document.querySelector("#search-user-btn");
const userLoading = document.querySelector("#user-loading");
const userError = document.querySelector("#user-error");
const userProfileCard = document.querySelector("#user-profile-card");

const userAvatar = document.querySelector("#user-avatar");
const userName = document.querySelector("#user-name");
const userEmail = document.querySelector("#user-email");
const userPhone = document.querySelector("#user-phone");
const userWebsite = document.querySelector("#user-website");
const userCompany = document.querySelector("#user-company");
const userAddress = document.querySelector("#user-address");
const userErrorText = document.querySelector("#user-error-text");

// Hàm showLoading với retry message
function showUserLoading(retryMessage = null) {
  userLoading.style.display = "block";
  if (retryMessage) {
    // Update text loading nếu retry
    const p = userLoading.querySelector("p");
    if (p) p.textContent = retryMessage;
  }

  userError.style.display = "none";
  userErrorText.style.display = "none";
}

// Hàm showError
function showUserError(message) {
  userErrorText.textContent = message;
  userError.style.display = "block";
  userProfileCard.style.display = "none";
}

// Hàm update DOM với user data
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

// Hàm handle search với Promise chain
function handleSearchUser() {
  const id = parseInt(userIdInput.value); // Lấy giá trị id người dùng nhập
  if (isNaN(id) || id < 1 || id > 10) {
    showUserError("Vui lòng nhập ID từ 1 đến 10!");
    return;
  }

  // Show loading ban đầu
  showUserLoading();

  // Wrap sendRequest với retry (max 1 lần)
  const retrySend = withRetry(sendRequest, 1, showUserLoading);

  retrySend("GET", `https://jsonplaceholder.typicode.com/users/${id}`)
    .then((user) => {
      userLoading.style.display = "none";
      updateUserProfile(user);
    })
    .catch((error) => {
      userLoading.style.display = "none";
      const msg = error.message.includes("404")
        ? "User không tồn tại!"
        : error.message;
      showUserError(msg);
    });
}

// === CHỨC NĂNG 2: POST VỚI COMMENT ===
const postsLoading = document.querySelector("#posts-loading");
const postsError = document.querySelector("#posts-error");
const postsErrorText = document.querySelector("#posts-error-text");
const postsContainer = document.querySelector("#posts-container");
const loadMoreBtn = document.querySelector("#load-more-posts-btn");

// Biến đếm số posts được loaded
let loadedPostsCount = 0;

// Hàm show loading cho posts với retry
function showPostsLoading(retryMessage = null) {
  postsLoading.style.display = "block";
  if (retryMessage) {
    const p = postsLoading.querySelector("p");
    if (p) p.textContent = retryMessage;
  }
  postsError.style.display = "none";
  loadMoreBtn.style.display = "none"; // Ẩn nút more khi loading
}

// Hàm show error cho posts
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
            <p class="post-author">Tác giả: <span class="author-name" data-user-id="${post.userId}">Loading...</span></p>
            <button class="show-comments-btn" data-post-id="${post.id}">Xem comments</button>
            <div class="comments-container" data-post-id="${post.id}" style="display: none;"></div>
        `;

    postsContainer.appendChild(postElement);
  });
}

// Hàm load posts (initial hoặc more)
function loadPosts(start = 0) {
  showPostsLoading();

  const retrySend = withRetry(sendRequest, 1, showPostsLoading);

  retrySend(
    "GET",
    `https://jsonplaceholder.typicode.com/posts?_start=${start}&_limit=5`
  )
    .then((posts) => {
      postsLoading.style.display = "none";
      renderPosts(posts, start > 0); // Append nếu start > 0 (load more)
      loadedPostsCount += posts.length;

      if (loadedPostsCount < 100) {
        loadMoreBtn.style.display = "block";
      } else {
        loadMoreBtn.style.display = "none";
      }
    })
    .catch((error) => {
      postsLoading.style.display = "none";
      showPostsError(error.message);
      loadMoreBtn.style.display = "block";
    });
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

// Hàm handle show comments
function handleShowComments(e) {
  if (!e.target.classList.contains("show-comments-btn")) return;

  const postId = parseInt(e.target.dataset.postId);
  const postElement = e.target.closest(".post-item");
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
  const retrySend = withRetry(sendRequest, 1);

  retrySend("GET", `https://jsonplaceholder.typicode.com/users/${userId}`)
    .then((user) => {
      authorSpan.textContent = user.name;
      return retrySend(
        "GET",
        `https://jsonplaceholder.typicode.com/posts/${postId}/comments`
      );
    })
    .then((comments) => {
      commentsContainer.innerHTML = "";
      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.className = "comment-item";
        commentElement.innerHTML = `
        <div class="comment-author">${comment.name}</div>
        <div class="comment-email">${comment.email}</div>
        <div classs="comment-body">${comment.body}</div>
      `;
        commentsContainer.appendChild(commentElement);
      });
    })
    .catch((error) => {
      commentsContainer.innerHTML = `<p>Lỗi: ${error.message}</p>`;
    });
}

function setupPostsEventListeners() {
  postsContainer.addEventListener("click", handleShowComments);
  loadMoreBtn.addEventListener("click", loadMorePosts);
}

// ===== CHỨC NĂNG 3: TODO LIST VỚI FILTER (REFACTOR VỚI PROMISE) =====
// ===== DOM ELEMENTS (SỬA SELECTOR ĐÚNG THEO HTML) =====
const todoUserIdInput = document.querySelector("#todo-user-id-input"); // Input user ID (OK).
const loadTodosBtn = document.querySelector("#load-todos-btn"); // Sửa: Thêm 's' ở todos.
const todoFilters = document.querySelectorAll(".filter-btn"); // Sửa: All class buttons (array).
const todoList = document.querySelector("#todo-list"); // OK.
const todosLoading = document.querySelector("#todos-loading"); // Sửa: Thêm 's' ở todos.
const todosError = document.querySelector("#todos-error"); // OK.
const todosErrorText = document.querySelector("#todos-error-text"); // OK.
const totalTodosEl = document.querySelector("#total-todos"); // OK (thêm 'El' cho nhất quán).
const completedTodosEl = document.querySelector("#completed-todos"); // OK.
const incompleteTodosEl = document.querySelector("#incomplete-todos"); // OK.

// ===== BIẾN GLOBAL =====
let allTodos = [];

// ===== HÀM SHOW LOADING CHO TODOS VỚI RETRY (SỬA UPDATE TEXT) =====
function showTodosLoading(retryMessage = null) {
  todosLoading.style.display = "block"; // Hiện loading.
  if (retryMessage) {
    // Sửa: Query <p> existing trong div để update text (không tạo mới).
    const p = todosLoading.querySelector("p");
    if (p) p.textContent = retryMessage; // E.g., "Đang retry lần 1/1...".
  }
  todosError.style.display = "none";
  todoList.innerHTML = "";
}

// ===== HÀM SHOW ERROR CHO TODOS =====
function showTodosError(message) {
  todosErrorText.textContent = message;
  todosError.style.display = "block";
}

// ===== HÀM RENDER TODOS =====
function renderTodos(todosToRender) {
  todoList.innerHTML = "";
  todosToRender.forEach((todo) => {
    const todoElement = document.createElement("div");
    todoElement.className = `todo-item ${
      todo.completed ? "completed" : "incomplete"
    }`;
    todoElement.setAttribute("data-todo-id", todo.id);
    todoElement.setAttribute("data-completed", todo.completed);
    todoElement.innerHTML = `
      <div class="todo-checkbox">${todo.completed ? "✅" : "⏳"}</div>
      <div class="todo-text">${todo.title}</div>
    `;
    todoList.appendChild(todoElement);
  });
}

// ===== HÀM UPDATE STATS =====
function updateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const incomplete = total - completed;
  totalTodosEl.textContent = total;
  completedTodosEl.textContent = completed;
  incompleteTodosEl.textContent = incomplete;
}

// ===== HÀM HANDLE LOAD TODOS VỚI PROMISE =====
function handleLoadTodos() {
  const id = parseInt(todoUserIdInput.value);
  if (isNaN(id) || id < 1 || id > 10) {
    showTodosError("ID phải từ 1 đến 10!");
    return;
  }

  showTodosLoading();

  const retrySend = withRetry(sendRequest, 1, showTodosLoading);

  retrySend("GET", `https://jsonplaceholder.typicode.com/users/${id}/todos`)
    .then((todos) => {
      todosLoading.style.display = "none";
      allTodos = todos;
      renderTodos(allTodos);
      updateStats(allTodos);
    })
    .catch((error) => {
      todosLoading.style.display = "none";
      showTodosError(error.message);
    });
}

// ===== HÀM HANDLE FILTER =====
function handleFilterTodos(e) {
  todoFilters.forEach((btn) => btn.classList.remove("active")); // Sửa: todoFilters (array).
  e.target.classList.add("active");
  const filter = e.target.dataset.filter;
  let filtered = [];
  if (filter === "all") filtered = allTodos;
  else if (filter === "completed")
    filtered = allTodos.filter((todo) => todo.completed);
  else filtered = allTodos.filter((todo) => !todo.completed);
  renderTodos(filtered);
}

// ===== GÁN SỰ KIỆN DOM =====
// User
searchUserBtn.addEventListener("click", handleSearchUser);

// Post
loadInitialPosts();
setupPostsEventListeners();

// Todos.
loadTodosBtn.addEventListener("click", handleLoadTodos);
todoFilters.forEach((btn) => btn.addEventListener("click", handleFilterTodos));
document.querySelector("#filter-all").classList.add("active");
