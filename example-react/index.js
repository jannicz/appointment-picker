import React from 'react';
import ReactDOM from 'react-dom';
import AppoPicker from './picker';
import '../example/demo.css';

const title = 'Appointment Picker Examples';

console.log('React started...');

ReactDOM.render(
    <article>
        <h1>{ title }</h1>
        <h2>Embed into a React component</h2>
        <p>
            <label>Time</label>
            <AppoPicker></AppoPicker>
        </p>
    </article>,
    document.getElementById('app')
);
