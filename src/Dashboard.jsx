import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const activityData = [
  { name: 'Jan', highlights: 80 }, { name: 'Feb', highlights: 35 },
  { name: 'Mar', highlights: 50 }, { name: 'Apr', highlights: 60 },
  { name: 'May', highlights: 65 }, { name: 'Jun', highlights: 50 },
  { name: 'Jul', highlights: 200 }, { name: 'Aug', highlights: 100 },
  { name: 'Sep', highlights: 150 }, { name: 'Oct', highlights: 80 },
  { name: 'Nov', highlights: 280 }, { name: 'Dec', highlights: 50 },
];

const topBooksData = [
    { name: 'Atomic Habits', highlights: 270 },
    { name: 'The Way of Kings', highlights: 240 },
    { name: 'Brandon Sanderson', highlights: 220 },
    { name: 'To the Stray', highlights: 200 },
    { name: 'Syssel of leadership', highlights: 180 },
];

const heatmapData = Array.from({ length: 7 * 12 }, () => Math.floor(Math.random() * 100));

const wordCloudData = [
    { text: 'productivity', value: 90 }, { text: 'system', value: 80 },
    { text: 'character', value: 70 }, { text: 'leadership', value: 85 },
    { text: 'develop', value: 60 }, { text: 'communities', value: 50 },
    { text: 'framework', value: 45 }, { text: 'reading', value: 65 },
];

const Dashboard = () => {
  return (
    <main className="main-content">
      <header>
        <h1>Kindle Clippings Insights</h1>
      </header>

      <div className="upload-zone">
        <p>Drag-and-drop zone to analyze.</p>
        <button className="upload-button">Upload My Clippings.txt file to analyze</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="title">Total Highlights</div>
          <div className="value">2,451</div>
        </div>
        <div className="stat-card">
          <div className="title">Books Noted</div>
          <div className="value">143</div>
        </div>
        <div className="stat-card">
          <div className="title">Most Read Author</div>
          <div className="value">Brandon Sanderson</div>
        </div>
        <div className="stat-card">
          <div className="title">Active Reading Days</div>
          <div className="value">312</div>
        </div>
        <div className="stat-card">
          <div className="title">Longest Streak</div>
          <div className="value">14 days</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <h3>Reading Activity Over Time (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="highlights" stroke="#8884d8" fill="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Top 5 Books by Highlights</h3>
           <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topBooksData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120}/>
                    <Tooltip />
                    <Bar dataKey="highlights" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="chart-card">
            <h3>Reading Time Habits (When you highlight)</h3>
            <div className="heatmap">
                {heatmapData.map((value, index) => (
                    <div
                        key={index}
                        className="heatmap-cell"
                        style={{ backgroundColor: `rgba(0, 100, 255, ${value / 100})` }}
                        title={`${value}% activity`}
                    ></div>
                ))}
            </div>
        </div>
        <div className="chart-card">
            <h3>Common Themes & Keywords</h3>
            <div className="word-cloud">
                {wordCloudData.map(word => (
                    <span key={word.text} style={{ fontSize: `${12 + word.value / 5}px`, fontWeight: word.value > 70 ? 'bold' : 'normal' }}>
                        {word.text}
                    </span>
                ))}
            </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
