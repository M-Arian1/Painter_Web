import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';

const Shape = ({ type, id, position, onMove, onDoubleClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'existing-shape',
    item: { id, type, isExisting: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getShapeElement = () => {
    const baseStyle = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      cursor: 'move',
      opacity: isDragging ? 0.5 : 1,
    };

    switch (type) {
      case 'circle':
        return (
          <div
            ref={drag}
            className="shape circle"
            style={baseStyle}
            onDoubleClick={() => onDoubleClick(id)}
          />
        );
      case 'square':
        return (
          <div
            ref={drag}
            className="shape square"
            style={baseStyle}
            onDoubleClick={() => onDoubleClick(id)}
          />
        );
      case 'triangle':
        return (
          <div
            ref={drag}
            className="shape triangle"
            style={baseStyle}
            onDoubleClick={() => onDoubleClick(id)}
          />
        );
      default:
        return null;
    }
  };

  return getShapeElement();
};

// Tool (sidebar)
const Tool = ({ type, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'new-tool',
    item: { type, isNew: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className={`tool tool-${type}`} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <div className={`tool-shape ${type}`}></div>
    </div>
  );
};

// Canvas (drawing area)
const Canvas = ({ shapes, onDrop, onMoveShape, onDoubleClickShape }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['new-tool', 'existing-shape'],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: offset.x - canvasRect.left - 25, // adjusting center
        y: offset.y - canvasRect.top - 25,
      };

      if (item.isNew) {
        onDrop(item.type, position);
      } else if (item.isExisting && item.id) {
        onMoveShape(item.id, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const canvasRef = useRef(null);

  return (
    <div
      ref={(node) => {
        drop(node);
        canvasRef.current = node;
      }}
      className={`canvas ${isOver ? 'canvas-hover' : ''}`}
    >
      <div className="canvas-label">Canvas</div>
      {shapes.map((shape) => (
        <Shape
          key={shape.id}
          {...shape}
          onMove={onMoveShape}
          onDoubleClick={onDoubleClickShape}
        />
      ))}
    </div>
  );
};

// Login Component
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.userId, data.username);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Connection error. Make sure the backend server is running on port 8080.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Painter Login</h2>
        <div className="default-users">
          <h4>Default Users (Click to use):</h4>
          <div className="user-buttons">
            <button 
              type="button" 
              className="user-btn"
              onClick={() => handleQuickLogin('admin', 'admin123')}
            >
              admin / admin123
            </button>
            <button 
              type="button" 
              className="user-btn"
              onClick={() => handleQuickLogin('user1', 'password1')}
            >
              user1 / password1
            </button>
            <button 
              type="button" 
              className="user-btn"
              onClick={() => handleQuickLogin('user2', 'password2')}
            >
              user2 / password2
            </button>
            <button 
              type="button" 
              className="user-btn"
              onClick={() => handleQuickLogin('artist', 'paint123')}
            >
              artist / paint123
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState('Painting Title');
  const [shapes, setShapes] = useState([]);
  const [shapeCounter, setShapeCounter] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const fileInputRef = useRef(null);

  // Load user's painting on login
  const handleLogin = async (userId, username) => {
    setCurrentUser({ id: userId, username });
    
    try {
      const response = await fetch(`http://localhost:8080/api/painting/${userId}`);
      const data = await response.json();
      
      setTitle(data.title);
      if (data.shapesData && data.shapesData !== '[]') {
        const loadedShapes = JSON.parse(data.shapesData);
        setShapes(loadedShapes);
      } else {
        setShapes([]);
      }
      setSaveStatus('Painting loaded successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to load painting:', error);
      setSaveStatus('Failed to load painting');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Save painting to server
  const handleSave = async () => {
    if (!currentUser) return;

    setSaveStatus('Saving...');

    try {
      const response = await fetch('http://localhost:8080/api/painting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          title,
          shapesData: JSON.stringify(shapes),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveStatus('Painting saved successfully!');
      } else {
        setSaveStatus('Failed to save painting');
      }
    } catch (error) {
      console.error('Failed to save painting:', error);
      setSaveStatus('Failed to save painting');
    }

    setTimeout(() => setSaveStatus(''), 3000);
  };

  // Logout function
  const handleLogout = () => {
    setCurrentUser(null);
    setTitle('Painting Title');
    setShapes([]);
    setShapeCounter(0);
    setSaveStatus('');
  };

  const handleDrop = (type, position) => {
    const newShape = {
      id: Date.now() + Math.random(), // More unique ID
      type,
      position,
    };
    setShapes(prevShapes => [...prevShapes, newShape]);
    setShapeCounter(shapeCounter + 1);
  };

  const handleMoveShape = (id, newPosition) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => 
        shape.id === id ? { ...shape, position: newPosition } : shape
      )
    );
  };

  const handleDoubleClickShape = (id) => {
    setShapes(shapes.filter(shape => shape.id !== id));
  };

  const getShapeCount = (type) => {
    return shapes.filter(shape => shape.type === type).length;
  };

  //JSON Export
  const handleExport = () => {
    const data = {
      title,
      shapes,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.username : 'unknown',
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${title.replace(/\s+/g, '_')}_painting.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  //JSON Import
  const handleImport = () => {
    fileInputRef.current.click();
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.title) setTitle(data.title);
          if (data.shapes) setShapes(data.shapes);
          setSaveStatus('File imported successfully!');
          setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // Auto-save every 30 seconds if user is logged in
  useEffect(() => {
    if (!currentUser) return;

    const autoSaveInterval = setInterval(() => {
      if (shapes.length > 0) {
        handleSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentUser, shapes, title]);

  // Show login form if not logged in
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="user-info">
            Welcome, <strong>{currentUser.username}</strong>! 
            <button onClick={handleLogout} className="btn logout-btn">Logout</button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Enter painting title..."
          />
          <div className="header-buttons">
            <button onClick={handleSave} className="btn save-btn">Save to Server</button>
            <button onClick={handleExport} className="btn">Export JSON</button>
            <button onClick={handleImport} className="btn">Import JSON</button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        </header>

        {/* Save Status */}
        {saveStatus && (
          <div className={`save-status ${saveStatus.includes('success') ? 'success' : 'error'}`}>
            {saveStatus}
          </div>
        )}

        <div className="main-content">
          {/* Canvas */}
          <Canvas
            shapes={shapes}
            onDrop={handleDrop}
            onMoveShape={handleMoveShape}
            onDoubleClickShape={handleDoubleClickShape}
          />

          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-title">Tools</div>
            <div className="sidebar-subtitle">Drag to canvas</div>
            <div className="tools">
              <Tool type="circle" />
              <Tool type="square" />
              <Tool type="triangle" />
            </div>
            <div className="instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>Drag shapes from here to canvas</li>
                <li>Move shapes around on canvas</li>
                <li>Double-click shapes to delete</li>
                <li>Changes auto-save every 30 seconds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Counter */}
        <div className="bottom-counter">
          <div className="counter-item">
            <div className="counter-shape circle"></div>
            <span>{getShapeCount('circle')} Circles</span>
          </div>
          <div className="counter-item">
            <div className="counter-shape square"></div>
            <span>{getShapeCount('square')} Squares</span>
          </div>
          <div className="counter-item">
            <div className="counter-shape triangle"></div>
            <span>{getShapeCount('triangle')} Triangles</span>
          </div>
          <div className="total-shapes">
            Total: {shapes.length} shapes
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;