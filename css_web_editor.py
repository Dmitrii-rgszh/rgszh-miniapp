#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSS Web Editor - Улучшенный веб-редактор для text.css
Простой и функциональный веб-интерфейс для редактирования CSS переменных
"""

from flask import Flask, render_template_string, request, jsonify
import re
import os
import json
import shutil
from datetime import datetime

app = Flask(__name__)

# HTML шаблон с улучшенным дизайном
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 CSS Text Editor - Telegram MiniApp</title>
    <style>
        :root {
            --editor-bg: linear-gradient(135deg, #b40037, #002682);
            --panel-bg: rgba(255, 255, 255, 0.1);
            --panel-border: rgba(255, 255, 255, 0.2);
            --input-bg: rgba(255, 255, 255, 0.15);
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
            --success-color: #28a745;
            --error-color: #dc3545;
            --warning-color: #ffc107;
        }

        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--editor-bg);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--panel-border);
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #fff, #ccc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .btn {
            background: linear-gradient(135deg, rgb(180, 0, 55), rgb(0, 40, 130));
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, rgb(152, 164, 174), rgb(118, 143, 146));
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .editor-layout {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 20px;
            min-height: calc(100vh - 200px);
        }
        
        .variables-section {
            background: var(--panel-bg);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid var(--panel-border);
            overflow-y: auto;
            max-height: calc(100vh - 200px);
        }
        
        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .preview-section, .info-section {
            background: var(--panel-bg);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid var(--panel-border);
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .variable-group {
            margin-bottom: 25px;
            border: 1px solid var(--panel-border);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .group-header {
            background: rgba(0, 0, 0, 0.3);
            padding: 12px 15px;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .group-content {
            padding: 15px;
        }
        
        .variable-row {
            display: grid;
            grid-template-columns: 150px 1fr auto;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 6px;
            transition: background 0.2s ease;
        }
        
        .variable-row:hover {
            background: rgba(255, 255, 255, 0.05);
        }
        
        .variable-label {
            font-size: 12px;
            color: var(--text-secondary);
            font-family: 'Consolas', monospace;
            font-weight: 500;
        }
        
        .variable-input {
            padding: 8px 12px;
            border: 1px solid var(--panel-border);
            border-radius: 6px;
            background: var(--input-bg);
            color: var(--text-primary);
            font-size: 13px;
            width: 100%;
            transition: all 0.2s ease;
        }
        
        .variable-input:focus {
            outline: none;
            border-color: rgb(180, 0, 55);
            box-shadow: 0 0 0 2px rgba(180, 0, 55, 0.2);
        }
        
        .color-picker {
            width: 32px;
            height: 32px;
            border: 2px solid var(--panel-border);
            border-radius: 6px;
            cursor: pointer;
            background: transparent;
            transition: transform 0.2s ease;
        }
        
        .color-picker:hover {
            transform: scale(1.1);
        }
        
        .preview-content {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid var(--panel-border);
        }
        
        .preview-item {
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
        }
        
        .status-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .status-toast.show {
            transform: translateX(0);
        }
        
        .status-toast.success { background: var(--success-color); }
        .status-toast.error { background: var(--error-color); }
        .status-toast.warning { background: var(--warning-color); color: #000; }
        
        .file-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px;
            border-radius: 6px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: rgb(180, 0, 55);
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 4px;
        }
        
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Адаптивность */
        @media (max-width: 768px) {
            .editor-layout {
                grid-template-columns: 1fr;
            }
            
            .variable-row {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            
            .variable-label {
                font-size: 11px;
            }
            
            .header-buttons {
                gap: 8px;
            }
            
            .btn {
                padding: 10px 16px;
                font-size: 13px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 10px;
            }
            
            .variables-section, .preview-section, .info-section {
                padding: 15px;
            }
            
            .header {
                padding: 15px 10px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
        
        /* Скроллбар */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }
    </style>
</head>
<body>
    <!-- Статус уведомления -->
    <div class="status-toast" id="statusToast"></div>
    
    <!-- Заголовок -->
    <div class="header">
        <h1>🎨 CSS Text Editor</h1>
        <p>Редактор переменных для Telegram MiniApp</p>
        <div class="header-buttons">
            <button class="btn" onclick="loadCSS()">
                <span id="loadIcon">📁</span> Загрузить CSS
            </button>
            <button class="btn" onclick="saveCSS()">
                <span id="saveIcon">💾</span> Сохранить
            </button>
            <button class="btn btn-secondary" onclick="previewChanges()">
                👀 Превью
            </button>
            <button class="btn btn-secondary" onclick="resetChanges()">
                🔄 Сброс
            </button>
            <button class="btn btn-secondary" onclick="exportSettings()">
                📤 Экспорт
            </button>
        </div>
    </div>
    
    <!-- Основной контент -->
    <div class="container">
        <div class="editor-layout">
            <!-- Редактор переменных -->
            <div class="variables-section">
                <div class="section-title">
                    ⚙️ Настройка переменных
                </div>
                <div id="variablesContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <div class="loading"></div>
                        <p style="margin-top: 10px;">Загрузка переменных...</p>
                    </div>
                </div>
            </div>
            
            <!-- Боковая панель -->
            <div class="sidebar">
                <!-- Информация о файле -->
                <div class="info-section">
                    <div class="section-title">📊 Статистика</div>
                    <div class="file-stats">
                        <div class="stat-item">
                            <div class="stat-value" id="varCount">0</div>
                            <div class="stat-label">Переменных</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="fileSize">0</div>
                            <div class="stat-label">Байт</div>
                        </div>
                    </div>
                    <div id="fileInfo">
                        <p style="color: var(--text-secondary); font-size: 13px;">
                            Файл не загружен
                        </p>
                    </div>
                </div>
                
                <!-- Превью -->
                <div class="preview-section">
                    <div class="section-title">👀 Превью стилей</div>
                    <div class="preview-content" id="previewContent">
                        <div class="preview-item">
                            <h1 id="previewH1" style="margin:0; font-size: 24px;">Заголовок H1</h1>
                        </div>
                        <div class="preview-item">
                            <h2 id="previewH2" style="margin:0; font-size: 20px;">Заголовок H2</h2>
                        </div>
                        <div class="preview-item">
                            <p id="previewBody" style="margin:0;">Основной текст</p>
                        </div>
                        <div class="preview-item">
                            <small id="previewSmall">Мелкий текст</small>
                        </div>
                        <div class="preview-item">
                            <button class="btn" id="previewBtn" style="font-size: 14px;">Кнопка</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let cssVariables = {};
        let originalCSS = '';
        let isLoading = false;
        
        // Группировка переменных
        const variableGroups = {
            '🔤 Шрифты': {
                icon: '🔤',
                variables: ['text-font-family', 'font-family']
            },
            '📏 Размеры текста': {
                icon: '📏',
                variables: ['text-size-h1', 'text-size-h2', 'text-size-h3', 'text-size-body', 'text-size-small', 'text-size-tiny']
            },
            '🎨 Цвета текста': {
                icon: '🎨',
                variables: ['text-color-primary', 'text-color-secondary', 'text-color-muted', 'text-color-white']
            }
        };
        
        // Загрузка CSS при старте
        window.addEventListener('DOMContentLoaded', () => {
            loadCSS();
        });
        
        // Загрузка CSS файла
        async function loadCSS() {
            if (isLoading) return;
            
            isLoading = true;
            const loadIcon = document.getElementById('loadIcon');
            loadIcon.innerHTML = '<span class="loading"></span>';
            
            try {
                const response = await fetch('/load-css');
                const data = await response.json();
                
                if (data.success) {
                    cssVariables = data.variables;
                    originalCSS = data.content;
                    createVariableEditors();
                    updatePreview();
                    updateStats(data.filename, Object.keys(data.variables).length, data.size);
                    showToast('CSS файл загружен успешно! 🎉', 'success');
                } else {
                    showToast('❌ Ошибка загрузки: ' + data.error, 'error');
                }
            } catch (error) {
                showToast('❌ Ошибка сети: ' + error.message, 'error');
            } finally {
                isLoading = false;
                loadIcon.innerHTML = '📁';
            }
        }
        
        // Создание редакторов переменных
        function createVariableEditors() {
            const container = document.getElementById('variablesContainer');
            container.innerHTML = '';
            
            // Создаем группы
            for (const [groupName, groupData] of Object.entries(variableGroups)) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'variable-group';
                
                const groupHeader = document.createElement('div');
                groupHeader.className = 'group-header';
                groupHeader.innerHTML = `${groupData.icon} ${groupName}`;
                
                const groupContent = document.createElement('div');
                groupContent.className = 'group-content';
                
                let hasVariables = false;
                
                groupData.variables.forEach(varName => {
                    if (cssVariables[varName]) {
                        const row = createVariableRow(varName, cssVariables[varName]);
                        groupContent.appendChild(row);
                        hasVariables = true;
                    }
                });
                
                if (hasVariables) {
                    groupDiv.appendChild(groupHeader);
                    groupDiv.appendChild(groupContent);
                    container.appendChild(groupDiv);
                }
            }
            
            // Остальные переменные
            const usedVars = Object.values(variableGroups).flatMap(g => g.variables);
            const otherVars = Object.keys(cssVariables).filter(key => !usedVars.includes(key));
            
            if (otherVars.length > 0) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'variable-group';
                
                const groupHeader = document.createElement('div');
                groupHeader.className = 'group-header';
                groupHeader.innerHTML = '🔧 Другие переменные';
                
                const groupContent = document.createElement('div');
                groupContent.className = 'group-content';
                
                otherVars.forEach(varName => {
                    const row = createVariableRow(varName, cssVariables[varName]);
                    groupContent.appendChild(row);
                });
                
                groupDiv.appendChild(groupHeader);
                groupDiv.appendChild(groupContent);
                container.appendChild(groupDiv);
            }
        }
        
        // Создание строки редактирования переменной
        function createVariableRow(varName, value) {
            const row = document.createElement('div');
            row.className = 'variable-row';
            
            const isColor = /^(#|rgb|rgba|hsl|hsla)/.test(value.trim());
            
            const label = document.createElement('div');
            label.className = 'variable-label';
            label.textContent = `--${varName}`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'variable-input';
            input.value = value;
            input.addEventListener('input', () => updateVariable(varName, input.value));
            
            row.appendChild(label);
            row.appendChild(input);
            
            if (isColor) {
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.className = 'color-picker';
                colorPicker.value = convertToHex(value);
                colorPicker.addEventListener('change', (e) => {
                    input.value = e.target.value;
                    updateVariable(varName, e.target.value);
                });
                row.appendChild(colorPicker);
            } else {
                row.appendChild(document.createElement('div')); // Пустой элемент для выравнивания
            }
            
            return row;
        }
        
        // Конвертация цвета в hex
        function convertToHex(color) {
            const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
            if (rgbaMatch) {
                const values = rgbaMatch[1].split(',').map(v => Math.round(parseFloat(v.trim())));
                // Если значения нормализованные (0-1), умножаем на 255
                if (values[0] <= 1) {
                    values[0] = Math.round(values[0] * 255);
                    values[1] = Math.round(values[1] * 255);
                    values[2] = Math.round(values[2] * 255);
                }
                return `#${values[0].toString(16).padStart(2, '0')}${values[1].toString(16).padStart(2, '0')}${values[2].toString(16).padStart(2, '0')}`;
            }
            return color.startsWith('#') ? color : '#ffffff';
        }
        
        // Обновление переменной
        function updateVariable(varName, value) {
            cssVariables[varName] = value;
            updatePreview();
        }
        
        // Обновление превью
        function updatePreview() {
            let cssText = ':root {';
            for (const [key, value] of Object.entries(cssVariables)) {
                cssText += `--${key}: ${value}; `;
            }
            cssText += '}';
            
            // Удаляем старый стиль
            const oldStyle = document.getElementById('previewStyle');
            if (oldStyle) oldStyle.remove();
            
            // Добавляем новый стиль
            const style = document.createElement('style');
            style.id = 'previewStyle';
            style.textContent = cssText + `
                #previewH1 { font-size: var(--text-size-h1, 32px); color: var(--text-color-primary, white); font-family: var(--text-font-family, 'Segoe UI'); }
                #previewH2 { font-size: var(--text-size-h2, 24px); color: var(--text-color-primary, white); font-family: var(--text-font-family, 'Segoe UI'); }
                #previewBody { font-size: var(--text-size-body, 16px); color: var(--text-color-secondary, white); font-family: var(--text-font-family, 'Segoe UI'); }
                #previewSmall { font-size: var(--text-size-small, 14px); color: var(--text-color-muted, white); font-family: var(--text-font-family, 'Segoe UI'); }
                #previewBtn { font-size: var(--text-size-body, 16px); color: var(--text-color-primary, white); font-family: var(--text-font-family, 'Segoe UI'); }
            `;
            document.head.appendChild(style);
        }
        
        // Сохранение CSS
        async function saveCSS() {
            const saveIcon = document.getElementById('saveIcon');
            saveIcon.innerHTML = '<span class="loading"></span>';
            
            try {
                const response = await fetch('/save-css', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({variables: cssVariables})
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Файл сохранен успешно!', 'success');
                } else {
                    showToast('❌ Ошибка сохранения: ' + data.error, 'error');
                }
            } catch (error) {
                showToast('❌ Ошибка сети: ' + error.message, 'error');
            } finally {
                saveIcon.innerHTML = '💾';
            }
        }
        
        // Превью в новом окне
        function previewChanges() {
            const cssVars = Object.entries(cssVariables).map(([k,v]) => `--${k}: ${v};`).join(' ');
            
            const previewHTML = `
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <title>Превью CSS переменных</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        :root { ${cssVars} }
                        body {
                            font-family: var(--text-font-family, 'Segoe UI');
                            background: linear-gradient(135deg, #b40037, #002682);
                            color: var(--text-color-primary, white);
                            padding: 40px;
                            line-height: 1.6;
                        }
                        .container {
                            max-width: 800px;
                            margin: 0 auto;
                            background: rgba(0, 0, 0, 0.3);
                            padding: 40px;
                            border-radius: 15px;
                        }
                        h1 { font-size: var(--text-size-h1, 32px); color: var(--text-color-primary); margin-bottom: 20px; }
                        h2 { font-size: var(--text-size-h2, 24px); color: var(--text-color-primary); margin-bottom: 16px; }
                        h3 { font-size: var(--text-size-h3, 20px); color: var(--text-color-primary); margin-bottom: 12px; }
                        p { font-size: var(--text-size-body, 16px); color: var(--text-color-secondary); margin-bottom: 16px; }
                        small { font-size: var(--text-size-small, 14px); color: var(--text-color-muted); }
                        .btn {
                            background: linear-gradient(135deg, rgb(180, 0, 55), rgb(0, 40, 130));
                            color: var(--text-color-primary);
                            padding: 16px 32px;
                            border: none;
                            border-radius: 12px;
                            font-size: var(--text-size-body);
                            cursor: pointer;
                            margin: 10px 5px;
                            display: inline-block;
                        }
                        .variables-list {
                            background: rgba(0, 0, 0, 0.2);
                            padding: 20px;
                            border-radius: 8px;
                            font-family: 'Consolas', monospace;
                            font-size: 12px;
                            margin-top: 30px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🎨 Превью стилей text.css</h1>
                        <h2>Заголовок второго уровня</h2>
                        <h3>Заголовок третьего уровня</h3>
                        <p>Это основной текст параграфа. Здесь можно увидеть, как выглядит текст с текущими настройками CSS переменных. Текст должен быть читаемым и красивым.</p>
                        <p><small>Это мелкий текст для дополнительной информации, подписей и примечаний.</small></p>
                        
                        <button class="btn">Главная кнопка</button>
                        <button class="btn">Вторая кнопка</button>
                        
                        <h3>📋 Используемые переменные:</h3>
                        <div class="variables-list">
${Object.entries(cssVariables).map(([k,v]) => `--${k}: ${v};`).join('<br>')}
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            const newWindow = window.open('', '_blank');
            newWindow.document.write(previewHTML);
            newWindow.document.close();
            
            showToast('🚀 Превью открыто в новом окне', 'success');
        }
        
        // Сброс изменений
        function resetChanges() {
            if (confirm('🔄 Сбросить все изменения к исходному состоянию?')) {
                loadCSS();
                showToast('🔄 Изменения сброшены', 'warning');
            }
        }
        
        // Экспорт настроек
        function exportSettings() {
            const dataStr = JSON.stringify(cssVariables, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'css-variables-' + new Date().toISOString().slice(0,10) + '.json';
            link.click();
            
            showToast('📤 Настройки экспортированы', 'success');
        }
        
        // Обновление статистики
        function updateStats(filename, varCount, fileSize) {
            document.getElementById('varCount').textContent = varCount;
            document.getElementById('fileSize').textContent = fileSize || 'N/A';
            document.getElementById('fileInfo').innerHTML = `
                <p style="font-size: 13px; margin-bottom: 8px;">
                    <strong>📄 Файл:</strong> ${filename}
                </p>
                <p style="font-size: 13px; color: var(--success-color);">
                    ✅ Успешно загружен
                </p>
            `;
        }
        
        // Показ уведомлений
        function showToast(message, type = 'success') {
            const toast = document.getElementById('statusToast');
            toast.textContent = message;
            toast.className = `status-toast ${type} show`;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    </script>
</body>
</html>
"""

class CSSWebEditor:
    def __init__(self):
        self.css_file_path = self.find_css_file()
        self.css_variables = {}
        self.original_content = ""
        
    def find_css_file(self):
        """Поиск text.css файла"""
        possible_paths = [
            "./src/Styles/text.css",
            "./Styles/text.css", 
            "./text.css",
            "../src/Styles/text.css",
            "../../src/Styles/text.css"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ Найден CSS файл: {path}")
                return path
                
        print("❌ CSS файл не найден в стандартных местах")
        return None
    
    def parse_css_variables(self):
        """Парсинг CSS переменных"""
        if not self.css_file_path:
            return {}
            
        try:
            with open(self.css_file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                self.original_content = content
                
            # Находим блок :root
            root_pattern = r':root\s*\{([^}]+)\}'
            root_match = re.search(root_pattern, content, re.DOTALL)
            
            if root_match:
                root_content = root_match.group(1)
                
                # Находим все переменные
                var_pattern = r'--([^:]+):\s*([^;]+);'
                variables = re.findall(var_pattern, root_content)
                
                self.css_variables = {k.strip(): v.strip() for k, v in variables}
                print(f"📊 Найдено переменных: {len(self.css_variables)}")
                
            return self.css_variables
        except Exception as e:
            print(f"❌ Ошибка парсинга CSS: {e}")
            return {}
    
    def save_css_variables(self, variables):
        """Сохранение CSS переменных"""
        if not self.css_file_path:
            return False
            
        try:
            # Создаем бэкап с временной меткой
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{self.css_file_path}.backup_{timestamp}"
            shutil.copy2(self.css_file_path, backup_path)
            print(f"📄 Создан бэкап: {backup_path}")
            
            # Обновляем CSS содержимое
            content = self.original_content
            root_pattern = r'(:root\s*\{)([^}]+)(\})'
            
            def replace_root(match):
                start = match.group(1)
                end = match.group(3)
                
                # Создаем новый блок переменных
                new_vars = []
                for var_name, var_value in variables.items():
                    new_vars.append(f"  --{var_name}: {var_value};")
                
                new_content = "\n" + "\n".join(new_vars) + "\n"
                return start + new_content + end
            
            updated_content = re.sub(root_pattern, replace_root, content, flags=re.DOTALL)
            
            # Сохраняем обновленный файл
            with open(self.css_file_path, 'w', encoding='utf-8') as file:
                file.write(updated_content)
                
            self.original_content = updated_content
            print(f"✅ CSS файл сохранен: {self.css_file_path}")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка сохранения: {e}")
            return False

# Создаем экземпляр редактора
editor = CSSWebEditor()

@app.route('/')
def index():
    """Главная страница"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/load-css')
def load_css():
    """Загрузка CSS файла"""
    variables = editor.parse_css_variables()
    
    if variables:
        file_size = os.path.getsize(editor.css_file_path) if editor.css_file_path else 0
        return jsonify({
            'success': True,
            'variables': variables,
            'content': editor.original_content,
            'filename': os.path.basename(editor.css_file_path) if editor.css_file_path else 'text.css',
            'size': file_size
        })
    else:
        return jsonify({
            'success': False,
            'error': 'CSS файл не найден или не содержит переменных в блоке :root'
        })

@app.route('/save-css', methods=['POST'])
def save_css():
    """Сохранение CSS файла"""
    try:
        data = request.get_json()
        variables = data.get('variables', {})
        
        success = editor.save_css_variables(variables)
        
        return jsonify({
            'success': success,
            'error': None if success else 'Не удалось сохранить файл'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    print("🚀 Запуск CSS Text Editor...")
    print("📁 Поиск text.css файла...")
    
    if editor.css_file_path:
        print(f"✅ Файл найден: {editor.css_file_path}")
    else:
        print("⚠️  Файл не найден, но редактор все равно запустится")
    
    print("\n🌐 Веб-редактор доступен по адресу:")
    print("   http://localhost:5000")
    print("\n💡 Для остановки нажмите Ctrl+C")
    print("-" * 50)
    
    app.run(debug=True, port=5000, host='0.0.0.0')