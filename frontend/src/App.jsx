import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:5000/todos";

async function fetchTodos() {
  const response = await fetch(API);
  if (!response.ok) throw new Error("Todo list load nahi hui");

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Todo list ka format sahi nahi hai");
  return data;
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);

  const loadTodos = useCallback(async () => {
    try {
      setTodos(await fetchTodos());
      setError("");
    } catch {
      setError("Server se connect nahi ho raha");
    }
  }, []);

  useEffect(() => {
    // Pehli baar app khulte hi server se todos mangwao.
    let isActive = true;
    fetchTodos()
      .then((data) => {
        if (isActive) {
          setTodos(data);
          setError("");
        }
      })
      .catch(() => {
        if (isActive) setError("Server se connect nahi ho raha");
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const retryLoadTodos = () => {
    setLoading(true);
    setError("");
    void loadTodos().finally(() => setLoading(false));
  };

  const addTodo = async (event) => {
    event.preventDefault();
    const newTitle = title.trim();
    if (!newTitle) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) throw new Error("Todo add nahi hua");

      setTitle("");
      // Har request ke baad list dobara server se milao.
      await loadTodos();
    } catch {
      setError("Server se connect nahi ho raha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTodo = async (id, method) => {
    setPendingIds((currentIds) => [...currentIds, id]);
    setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method });
      if (!response.ok) throw new Error("Todo update nahi hua");
      await loadTodos();
    } catch {
      setError("Server se connect nahi ho raha");
    } finally {
      setPendingIds((currentIds) => currentIds.filter((currentId) => currentId !== id));
    }
  };

  const remainingCount = todos.filter((todo) => !todo.done).length;
  const completedCount = todos.length - remainingCount;

  return (
    <main className="page-shell">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="card-header">
          <p className="eyebrow">AAJ KA PLAN</p>
          <h1 id="page-title">Meri Todo List</h1>
          <p className="intro-text">Apne kaamon ko ek ek karke poora karein.</p>
        </header>

        <form className="todo-form" onSubmit={addTodo}>
          <label className="visually-hidden" htmlFor="todo-title">Naya kaam</label>
          <input
            id="todo-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Naya kaam likho..."
            autoComplete="off"
          />
          <button className="add-button" type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Jor rahe hain..." : "Add"}
          </button>
        </form>

        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
            <button className="retry-button" type="button" onClick={retryLoadTodos}>
              Dobara koshish
            </button>
          </div>
        )}

        {loading ? (
          <p className="state-message" role="status">Kaam load ho rahe hain...</p>
        ) : !error && todos.length === 0 ? (
          <p className="state-message empty-message">Abhi koi kaam nahi, naya add karo</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => {
              const isPending = pendingIds.includes(todo._id);

              return (
                <li className={`todo-row${todo.done ? " is-done" : ""}`} key={todo._id}>
                  <button
                    className="todo-toggle"
                    type="button"
                    onClick={() => void updateTodo(todo._id, "PUT")}
                    disabled={isPending}
                    aria-label={`${todo.done ? "Mukammal kaam dobara kholo" : "Kaam mukammal karo"}: ${todo.title}`}
                    aria-pressed={todo.done}
                  >
                    <span className="todo-check" aria-hidden="true">{todo.done ? "✓" : ""}</span>
                    <span className="todo-title">{todo.title}</span>
                  </button>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => void updateTodo(todo._id, "DELETE")}
                    disabled={isPending}
                    aria-label={`Todo delete karein: ${todo.title}`}
                    title="Delete"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && (
          <footer className="todo-footer" aria-live="polite">
            <span className="count-dot" aria-hidden="true" />
            <p>{remainingCount} kaam baaki, {completedCount} mukammal</p>
          </footer>
        )}
      </section>
    </main>
  );
}

export default App;