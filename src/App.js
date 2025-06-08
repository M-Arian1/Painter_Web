import React, { useState, useRef } from 'react';
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

// Main App
const App = () => {
  const [title, setTitle] = useState('Painting Title');
  const [shapes, setShapes] = useState([]);
  const [shapeCounter, setShapeCounter] = useState(0);
  const fileInputRef = useRef(null);


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
        } catch (error) {
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        {/* Header */}
        <header className="header">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />
          <div className="header-buttons">
            <button onClick={handleExport} className="btn">Export</button>
            <button onClick={handleImport} className="btn">Import</button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        </header>

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
            <div className="tools">
              <Tool type="circle" />
              <Tool type="square" />
              <Tool type="triangle" />
            </div>
          </div>
        </div>

        {/* Bottom Counter */}
        <div className="bottom-counter">
          <div className="counter-item">
            <div className="counter-shape circle"></div>
            <span>{getShapeCount('circle')}</span>
          </div>
          <div className="counter-item">
            <div className="counter-shape square"></div>
            <span>{getShapeCount('square')}</span>
          </div>
          <div className="counter-item">
            <div className="counter-shape triangle"></div>
            <span>{getShapeCount('triangle')}</span>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;