import imgObj from '../common/imgObj';
import { bindActionCreators } from 'redux';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { setZoomRatio } from '../../actions';
import CropHandlers from './CropHandlers';
import PixelateHandlers from './PixelateHandlers';
import MiniHandlers from './MiniaturizeHandlers';


const Canvas = (props) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);
  const prevZoomRatio = useRef(props.zoomRatio);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [currentBox, setCurrentBox] = useState(null);

  const redrawCanvas = useCallback(() => {
    if (ctxRef.current && canvasRef.current && imageRef.current) {
      const ctx = ctxRef.current;
      // ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the image
      ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw all bounding boxes
      [...boundingBoxes, currentBox].filter(Boolean).forEach(box => {
        ctx.strokeStyle = box === currentBox ? 'blue' : 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      });
      // c/tx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [boundingBoxes, currentBox]);

  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
      imageRef.current = new Image();
      imageRef.current.onload = redrawCanvas;
      props.loadImage();
    }
  }, [props.loadImage, redrawCanvas]);

  useEffect(() => {
    if (props.zoomRatio === 0) return;
    if (props.zoomRatio !== prevZoomRatio.current) {
      props.resizeCanvas(false);
      redrawCanvas();
    }
    prevZoomRatio.current = props.zoomRatio;
  }, [props.zoomRatio, props.resizeCanvas, redrawCanvas]);

  useEffect(() => {
    if (props.imgObj && props.imgObj.imgBuff) {
      imageRef.current.src = props.imgObj.imgBuff;
    }
  }, [props.imgObj]);

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox(null);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newBox = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y)
    };

    setCurrentBox(newBox);
    redrawCanvas();
  };

  const stopDrawing = () => {
    if (isDrawing && currentBox) {
      setBoundingBoxes(prevBoxes => [...prevBoxes, currentBox]);
    }
    setIsDrawing(false);
    setCurrentBox(null);
    redrawCanvas();
  };

  const handleZoomChange = (newZoomRatio) => {
    props.setZoomRatio(newZoomRatio);
  };

  return (
    <div
      className='scrollbar'
      id='canvas-container'
      style={{
        width: props.containerWidth,
        position: 'absolute',
        bottom: '44px',
        top: 0,
        backgroundColor: '#1e2025'
      }}
    >
      <canvas
        id='canvas'
        ref={canvasRef}
        style={{position: 'absolute', margin: '20px'}}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />

      {props.cropHandlersVisible && <CropHandlers zoomRatio={props.zoomRatio} onZoomChange={handleZoomChange} />}
      {props.pixelateHandlersVisible && <PixelateHandlers zoomRatio={props.zoomRatio} onZoomChange={handleZoomChange} />}
      {props.miniHandlersVisible && <MiniHandlers zoomRatio={props.zoomRatio} onZoomChange={handleZoomChange} />}
    </div>
  );
};



const mapStateToProps = state => (
  {
    zoomRatio: state.imgStat.get('zoomRatio'),
    cropHandlersVisible: state.cropHandlersVisible,
    pixelateHandlersVisible: state.pixelateHandlers.get('visible'),
    miniHandlersVisible: state.miniHandlers.get('visible'),
  }
);
const mapDispatchToProps = dispatch => bindActionCreators({setZoomRatio},dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Canvas);
