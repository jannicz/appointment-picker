import React from 'react';
import ReactDOM from 'react-dom';
import AppoPicker from './react-component';
import '../demo.css';

const title = 'Appointment Picker Examples';

console.log('React started...');

ReactDOM.render(
    <div>
        <h1>{ title }</h1>
        <h2>Embed into a React component</h2>
        <div>
            <label>Time</label>
            <AppoPicker></AppoPicker>
        </div>
    </div>,
    document.getElementById('app')
);
