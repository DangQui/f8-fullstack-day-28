function sendRequest(method, url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.onload = function () {
    if (this.status >= 200 && xhr.status <= 400) {
      try {
        const data = JSON.parse(xhr.responseText);
        // Gọi callback với null (no error) và data
        callback(null, data);
      } catch (error) {
        // Nếu JSON lỗi trả về callback
        callback(new Error("Invalid JSON"), null);
      }
    } else {
      callback(new Error(`HTTP error: ${xhr.status}`), null);
    }
  };

  xhr.onerror = function () {
    callback(new Error("Không thể kết nối!"), null);
  };

  xhr.send();
}

/* 
  CHỨC NĂNG 1: Tải Thông Tin Của User 
*/
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

// Hàm xử lý response từ API
function renderUser(error, data) {
  // Ẩn loading khi API Call hoàn tất
  userLoading.style.display = "none";

  // Kiểm tra nếu có lỗi từ API
  if (error) {
    // Set text lỗi: Nếu là 404, thông báo rõ ràng, còn lại dùng message từ error
    userErrorText.textContent = error.message.includes("404")
      ? "User không tồn tại!"
      : error.message;
    userError.style.display = "block";
    userProfileCard.style.display = "none";
    return;
  }

  // Thành Công: Update DOM
  // Lấy chữ cái đầu IN HOA làm AVT
  userAvatar.textContent = data.name.charAt(0).toUpperCase();
  userName.textContent = data.name;
  userEmail.textContent = data.email;
  userPhone.textContent = data.phone;
  userWebsite.textContent = data.website;
  userCompany.textContent = data.company.name;
  userAddress.textContent = `${data.address.street}, ${data.address.city}`;

  // Hiển Card để người dùng thấy thông tin
  userProfileCard.style.display = "block";
  userError.style.display = "none";
}

// Hàm xử lý sự kiện click
function handleSearchUser() {
  // Lấy giá trị từ input
  const userId = parseInt(userIdInput.value);
  if (isNaN(userId) || userId < 1 || userId > 10) {
    userErrorText.textContent = "ID phải từ 1 đến 10!";
    userError.style.display = "block";
    userProfileCard.style.display = "none";
    return;
  }

  // Hiện loading trong lúc đang chờ
  userLoading.style.display = "block";
  userError.style.display = "none";
  userProfileCard.style.display = "none";

  // Tạo URL
  const url = `https://jsonplaceholder.typicode.com/users/${userId}`;
  sendRequest("GET", url, renderUser);
}

searchUserBtn.addEventListener("click", handleSearchUser);

/* 
  CHỨC NĂNG 2: Tự Động Load 5 Post Đầu Tiên Khi Vào Trang  
*/
const postsLoading = document.querySelector("#posts-loading");
const postsError = document.querySelector("#posts-error");
const postsErrorText = document.querySelector("#posts-error-text");
const postsContainer = document.querySelector("#posts-container");
const loadMoreBtn = document.querySelector("#load-more-posts-btn");

let loadedPostsCount = 0;

// Hàm xử lý tự động posts 5 bài khi load
function loadInitialPosts() {
  postsLoading.style.display = "block";
  postsError.style.display = "none";
  postsContainer.innerHTML = "";

  const url = "https://jsonplaceholder.typicode.com/posts?_limit=5";
  sendRequest("GET", url, handlePostsResponse);
}

function loadMorePosts() {
  postsLoading.style.display = "block";
  loadMoreBtn.style.display = "none"; // Ẩn tạm thời để tránh click nhiêu lần

  // Bỏ qua số posts đã load
  const url = `https://jsonplaceholder.typicode.com/posts?_start=${loadedPostsCount}&_limit=5`;

  sendRequest("GET", url, handlePostsResponse);
}

function handlePostsResponse(error, posts) {
  postsLoading.style.display = "none";

  if (error) {
    postsErrorText.textContent = error.message;
    postsError.style.display = "block";
    loadMoreBtn.style.display = "block";
    return;
  }

  renderPosts(posts, true);

  loadedPostsCount += posts.length;

  if (loadedPostsCount < 100) {
    loadMoreBtn.style.display = "block"; // Nếu còn post thì thị nút Btn
  } else {
    loadMoreBtn.style.display = "none"; // Hết post thì ẩn
  }
}

function renderPosts(posts, append = false) {
  // Nếu không append, clear container trước khi render
  if (!append) {
    postsContainer.innerHTML = "";
  }

  posts.forEach((post) => {
    // Tạo element div cho post mới
    const postElement = document.createElement("div");
    // Set class để style CSS
    postElement.className = "post-item";
    // Set attribute để dễ tìm khi click
    postElement.setAttribute("data-post-id", post.id);

    // Tạo nội dung HTML cho POST
    postElement.innerHTML = `
      <h4 class="post-title">${post.title}</h4>
      <p class="post-body">${post.body}</p>
      <p class="post-author">Tác giả: <span class="author-name" data-user-id="${post.userId}">Loading...</span></p>
      <button class="show-comments-btn" data-post-id="${post.id}">Xem comments</button>
      <div class="comments-container" data-post-id="${post.id}" style="display: none"></div>
    `;

    postsContainer.appendChild(postElement);
  });
}

// Hàm xử lý event listener cho container
function setupPostsEventListeners() {
  postsContainer.addEventListener("click", handleShowComments);
  loadMoreBtn.addEventListener("click", loadMorePosts);
}

// Hàm xử lý click, nhận event
function handleShowComments(e) {
  // Kiểm tra nếu element được click có class "show-comments-btn", nếu không phải btn return
  if (!e.target.classList.contains("show-comments-btn")) return;

  // Lấy postId từ data-post-id của button
  const postId = parseInt(e.target.dataset.postId);
  // Tìm post element cha (closest) để dễ truy cập author và comments container
  const postElement = e.target.closest(".post-item");
  const authorSpan = postElement.querySelector(".author-name");
  const commentsContainer = postElement.querySelector(".comments-container");

  // Toggle: Nếu comments đang hiển thị, ẩn và đổi text button
  if (commentsContainer.style.display === "block") {
    commentsContainer.style.display = "none";
    e.target.textContent = "Xem comments";
    return;
  }

  // Nếu chưa load comments: Hiển thị loading
  commentsContainer.innerHTML = "<p>🔄 Đang tải comments...</p>";
  // Hiện comments container
  commentsContainer.style.display = "block";
  // Đổi text thành ẩn
  e.target.textContent = "Ẩn comments";

  const url = `https://jsonplaceholder.typicode.com/posts/${postId}/comments`;

  sendRequest("GET", url, handleCommentsResponse.bind(null, commentsContainer));
}

function handleCommentsResponse(commentsContainer, error, comments) {
  if (error) {
    commentsContainer.innerHTML = `<p>Lỗi: ${error.message}</p>`;
    return;
  }

  commentsContainer.innerHTML = "";
  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.className = "comment-item";

    commentElement.innerHTML = `
      <div class="comment-author">${comment.name}</div>
      <div class="comment-email">${comment.email}</div>
      <div class="comment-body">${comment.body}</div>
    `;

    commentsContainer.appendChild(commentElement);
  });
}

// Tự động load 5 posts đầu
loadInitialPosts();

// Gắn events cho click comment là load more
setupPostsEventListeners();

/*
  CHỨC NĂNG 3: Todo List Với Filter
*/
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

// Lưu tất cả todos để sử dụng cho filter
let allTodos = [];

// Hàm xử lý button "Load Todos"
function handleLoadTodos() {
  const userId = parseInt(todoUserIdInput.value);
  if (isNaN(userId) || userId < 1 || userId > 10) {
    todosErrorText.textContent = "ID phải nhập từ 1 đến 10";
    todosError.style.display = "block";
    return;
  }

  todosLoading.style.display = "block";
  todosError.style.display = "none";
  todoList.innerHTML = "";

  const url = `https://jsonplaceholder.typicode.com/users/${userId}/todos`;

  sendRequest("GET", url, handleTodosResponse);
}

// Hàm hiển thị trạng thái loading cho todos
function showTodosLoading() {
  todosLoading.style.display = "block";
  todosError.style.display = "none";
  todoList.innerHTML = "";
}

// Hàm hiển thị lỗi
function showTodosError(message) {
  todosErrorText.textContent = message;
  todosError.style.display = "block";
}

// Hàm xử lý response từ API
function handleTodosResponse(error, todos) {
  // Ẩn state loading khi API call hoàn tất
  todosLoading.style.display = "none";

  // Kiểm tra nếu có lỗi từ API
  if (error) {
    showTodosError(error.message);
    return;
  }

  // Thành Công:
  allTodos = todos;
  renderTodos(allTodos);
  updateStats(allTodos);
}

// Hàm render Arr todos
function renderTodos(todos) {
  // Clear trước khi render mới
  todoList.innerHTML = "";
  // Loop qua từng todo trong array cần render
  todos.forEach((todo) => {
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

// Hàm cập nhật số lượng todos ở mỗi trạng thái
function updateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const incomplete = total - completed;
  totalTodosEl.textContent = total;
  completedTodosEl.textContent = completed;
  incompleteTodosEl.textContent = incomplete;
}

// Hàm xử lý khi click button filter
function handleFilterTodos(e) {
  const targetBtn = e.target;

  // Xóa class "active" khổi tất cả filter buttons
  todoFilters.forEach((btn) => btn.classList.remove("active"));
  // Thêm class cho button được click
  targetBtn.classList.add("active");

  // Lấy filter từ data-filter
  const filter = targetBtn.dataset.filter;
  // Tạo arr filtered dựa trên filter type
  let filteredTodos = [];
  if (filter === "all") {
    // Nếu "all" dùng tất cả todos
    filteredTodos = allTodos;
  } else if (filter === "completed") {
    // Nếu 'completed', filter chỉ todos với completed = true
    filteredTodos = allTodos.filter((todo) => todo.completed);
  } else if (filter === "incomplete") {
    filteredTodos = allTodos.filter((todo) => !todo.completed);
  }

  renderTodos(filteredTodos);
}

loadTodosBtn.addEventListener("click", handleLoadTodos);

todoFilters.forEach((todoBtn) => {
  todoBtn.addEventListener("click", handleFilterTodos);
});

document.querySelector("#filter-all").classList.add("active");
