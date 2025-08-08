# -*- coding: utf-8 -*-
"""
Development Toolkit - Материнская программа для инструментов разработки
Главное меню с доступом ко всем инструментам разработки MiniApp
"""

import sys
import subprocess
import os
import webbrowser
from pathlib import Path
import threading
import json
from datetime import datetime

try:
    import tkinter as tk
    from tkinter import ttk, messagebox
except ImportError:
    print("Ошибка: tkinter не установлен")
    print("Установите tkinter: pip install tk")
    input("Нажмите Enter для выхода...")
    sys.exit(1)

class DevelopmentToolkit:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🚀 Development Toolkit - MiniApp")
        self.root.geometry("1000x700")
        self.root.minsize(800, 600)
        
        # Корпоративные цвета
        self.colors = {
            'primary_red': '#B40037',
            'secondary_red': '#990037',
            'primary_gray': '#98A4AE',
            'secondary_gray': '#769394',
            'primary_blue': '#002882',
            'secondary_blue': '#002068',
            'background': '#f5f6fa',
            'card_bg': '#ffffff',
            'text_primary': '#2c3e50',
            'text_secondary': '#7f8c8d',
            'success': '#27ae60',
            'warning': '#f39c12',
            'error': '#e74c3c'
        }
        
        # Настройка стилей
        self.setup_styles()
        
        # Создание интерфейса
        self.create_interface()
        
        # Загрузка настроек
        self.load_settings()
        
        # Проверка доступности инструментов
        self.check_tools_availability()
    
    def setup_styles(self):
        """Настройка корпоративных стилей"""
        self.root.configure(bg=self.colors['background'])
        
        # Настройка ttk стилей
        style = ttk.Style()
        style.theme_use('clam')
        
        # Стиль для основных кнопок
        style.configure(
            'Primary.TButton',
            background=self.colors['primary_red'],
            foreground='white',
            borderwidth=0,
            focuscolor='none',
            padding=(20, 12),
            font=('Segoe UI', 12, 'bold')
        )
        
        style.map(
            'Primary.TButton',
            background=[('active', self.colors['secondary_red']),
                       ('pressed', self.colors['secondary_red'])]
        )
        
        # Стиль для вторичных кнопок
        style.configure(
            'Secondary.TButton',
            background=self.colors['primary_gray'],
            foreground='white',
            borderwidth=0,
            focuscolor='none',
            padding=(15, 10),
            font=('Segoe UI', 11)
        )
        
        style.map(
            'Secondary.TButton',
            background=[('active', self.colors['secondary_gray']),
                       ('pressed', self.colors['secondary_gray'])]
        )
        
        # Стиль для карточек инструментов
        style.configure(
            'Tool.TFrame',
            background=self.colors['card_bg'],
            relief='raised',
            borderwidth=1
        )
    
    def create_interface(self):
        """Создание главного интерфейса"""
        
        # Заголовок приложения
        header_frame = tk.Frame(self.root, bg=self.colors['primary_red'], height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)
        
        # Логотип и название
        title_frame = tk.Frame(header_frame, bg=self.colors['primary_red'])
        title_frame.pack(expand=True, fill=tk.BOTH)
        
        title_label = tk.Label(
            title_frame,
            text="🚀 Development Toolkit",
            font=('Segoe UI', 24, 'bold'),
            fg='white',
            bg=self.colors['primary_red']
        )
        title_label.pack(pady=15)
        
        subtitle_label = tk.Label(
            title_frame,
            text="Инструменты разработки для MiniApp",
            font=('Segoe UI', 12),
            fg='white',
            bg=self.colors['primary_red']
        )
        subtitle_label.pack()
        
        # Основной контейнер
        main_container = tk.Frame(self.root, bg=self.colors['background'])
        main_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Создание вкладок
        self.create_tools_section(main_container)
        self.create_utilities_section(main_container)
        self.create_status_bar()
    
    def create_tools_section(self, parent):
        """Создание секции основных инструментов"""
        
        # Заголовок секции
        tools_label = tk.Label(
            parent,
            text="🛠 Основные инструменты",
            font=('Segoe UI', 18, 'bold'),
            fg=self.colors['text_primary'],
            bg=self.colors['background']
        )
        tools_label.pack(anchor='w', pady=(0, 15))
        
        # Контейнер для карточек инструментов
        tools_frame = tk.Frame(parent, bg=self.colors['background'])
        tools_frame.pack(fill=tk.X, pady=(0, 30))
        
        # Сетка инструментов (2 колонки)
        self.create_tool_card(
            tools_frame, 
            row=0, col=0,
            title="🎨 CSS Text Editor",
            description="Визуальный редактор CSS переменных\nдля настройки стилей приложения",
            status="Готов к использованию",
            action=self.open_css_editor,
            style="primary"
        )
        
        self.create_tool_card(
            tools_frame,
            row=0, col=1,
            title="📱 Component Generator",
            description="Генератор React компонентов\nс корпоративными стилями",
            status="В разработке",
            action=self.show_component_generator,
            style="secondary"
        )
        
        self.create_tool_card(
            tools_frame,
            row=1, col=0,
            title="🔍 Code Analyzer",
            description="Анализатор кода и проверка\nсоответствия стандартам",
            status="Планируется",
            action=self.show_code_analyzer,
            style="secondary"
        )
        
        self.create_tool_card(
            tools_frame,
            row=1, col=1,
            title="📦 Build Manager",
            description="Управление сборкой и деплоем\nприложения",
            status="Планируется",
            action=self.show_build_manager,
            style="secondary"
        )
    
    def create_tool_card(self, parent, row, col, title, description, status, action, style="primary"):
        """Создание карточки инструмента"""
        
        # Основная рамка карточки
        card_frame = tk.Frame(
            parent,
            bg=self.colors['card_bg'],
            relief='raised',
            borderwidth=2
        )
        card_frame.grid(row=row, column=col, padx=10, pady=10, sticky='nsew', ipadx=15, ipady=15)
        
        # Настройка сетки
        parent.columnconfigure(col, weight=1)
        parent.rowconfigure(row, weight=1)
        
        # Заголовок инструмента
        title_label = tk.Label(
            card_frame,
            text=title,
            font=('Segoe UI', 14, 'bold'),
            fg=self.colors['text_primary'],
            bg=self.colors['card_bg']
        )
        title_label.pack(anchor='w', pady=(0, 10))
        
        # Описание
        desc_label = tk.Label(
            card_frame,
            text=description,
            font=('Segoe UI', 11),
            fg=self.colors['text_secondary'],
            bg=self.colors['card_bg'],
            justify=tk.LEFT
        )
        desc_label.pack(anchor='w', pady=(0, 15))
        
        # Статус
        status_color = self.colors['success'] if status == "Готов к использованию" else self.colors['warning']
        status_label = tk.Label(
            card_frame,
            text=f"📊 {status}",
            font=('Segoe UI', 10),
            fg=status_color,
            bg=self.colors['card_bg']
        )
        status_label.pack(anchor='w', pady=(0, 15))
        
        # Кнопка действия
        button_style = 'Primary.TButton' if style == 'primary' else 'Secondary.TButton'
        action_btn = ttk.Button(
            card_frame,
            text="Открыть" if status == "Готов к использованию" else "Скоро...",
            style=button_style,
            command=action if status == "Готов к использованию" else None,
            state='normal' if status == "Готов к использованию" else 'disabled'
        )
        action_btn.pack(anchor='w')
        
        # Добавление hover эффекта
        self.add_hover_effect(card_frame)
    
    def create_utilities_section(self, parent):
        """Создание секции утилит"""
        
        # Заголовок секции
        utils_label = tk.Label(
            parent,
            text="⚡ Быстрые утилиты",
            font=('Segoe UI', 18, 'bold'),
            fg=self.colors['text_primary'],
            bg=self.colors['background']
        )
        utils_label.pack(anchor='w', pady=(0, 15))
        
        # Контейнер утилит
        utils_frame = tk.Frame(parent, bg=self.colors['background'])
        utils_frame.pack(fill=tk.X)
        
        # Горизонтальные кнопки утилит
        utils_buttons_frame = tk.Frame(utils_frame, bg=self.colors['background'])
        utils_buttons_frame.pack(fill=tk.X)
        
        # Кнопки утилит
        utilities = [
            ("📁 Открыть проект", self.open_project_folder),
            ("🌐 Запустить сервер", self.start_dev_server),
            ("📋 Системная информация", self.show_system_info),
            ("⚙️ Настройки", self.open_settings),
            ("❓ Справка", self.show_help)
        ]
        
        for i, (text, command) in enumerate(utilities):
            btn = ttk.Button(
                utils_buttons_frame,
                text=text,
                style='Secondary.TButton',
                command=command
            )
            btn.grid(row=0, column=i, padx=5, pady=5, sticky='ew')
            utils_buttons_frame.columnconfigure(i, weight=1)
    
    def create_status_bar(self):
        """Создание строки статуса"""
        
        self.status_frame = tk.Frame(self.root, bg=self.colors['primary_gray'], height=30)
        self.status_frame.pack(side=tk.BOTTOM, fill=tk.X)
        self.status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(
            self.status_frame,
            text="Готов к работе",
            font=('Segoe UI', 10),
            fg='white',
            bg=self.colors['primary_gray']
        )
        self.status_label.pack(side=tk.LEFT, padx=10, pady=5)
        
        # Информация о проекте
        project_info = tk.Label(
            self.status_frame,
            text=f"Проект: {self.get_project_name()} | Python {sys.version.split()[0]}",
            font=('Segoe UI', 10),
            fg='white',
            bg=self.colors['primary_gray']
        )
        project_info.pack(side=tk.RIGHT, padx=10, pady=5)
    
    def add_hover_effect(self, widget):
        """Добавление hover эффекта для карточек"""
        original_bg = widget.cget('bg')
        
        def on_enter(event):
            widget.configure(bg='#f8f9fa')
        
        def on_leave(event):
            widget.configure(bg=original_bg)
        
        widget.bind("<Enter>", on_enter)
        widget.bind("<Leave>", on_leave)
    
    def update_status(self, message, color=None):
        """Обновление строки статуса"""
        self.status_label.configure(text=message)
        if color:
            self.status_label.configure(fg=color)
        
        # Автоматический сброс через 5 секунд
        self.root.after(5000, lambda: self.status_label.configure(text="Готов к работе", fg='white'))
    
    # ======================================
    # ДЕЙСТВИЯ ИНСТРУМЕНТОВ
    # ======================================
    
    def open_css_editor(self):
        """Запуск CSS Text Editor"""
        self.update_status("🎨 Запуск CSS Text Editor...", self.colors['success'])
        
        try:
            # Проверяем наличие файла редактора
            editor_path = Path(__file__).parent / "text_css_editor.py"
            if not editor_path.exists():
                # Если веб-версии нет, ищем desktop версию
                editor_path = Path(__file__).parent / "css_editor.py"
            
            if editor_path.exists():
                # Запускаем в отдельном процессе
                threading.Thread(
                    target=self.run_tool,
                    args=(str(editor_path), "CSS Text Editor"),
                    daemon=True
                ).start()
            else:
                self.show_tool_not_found("CSS Text Editor", "text_css_editor.py или css_editor.py")
        
        except Exception as e:
            messagebox.showerror("Ошибка", f"Не удалось запустить CSS Editor:\n{str(e)}")
            self.update_status("❌ Ошибка запуска CSS Editor", self.colors['error'])
    
    def show_component_generator(self):
        """Показать генератор компонентов (заглушка)"""
        messagebox.showinfo(
            "Component Generator",
            "🚧 Инструмент в разработке\n\n"
            "Планируемые возможности:\n"
            "• Генерация React компонентов\n"
            "• Автоматическое подключение стилей\n"
            "• Шаблоны для типовых элементов\n"
            "• Интеграция с корпоративными стилями"
        )
    
    def show_code_analyzer(self):
        """Показать анализатор кода (заглушка)"""
        messagebox.showinfo(
            "Code Analyzer",
            "🚧 Инструмент планируется\n\n"
            "Планируемые возможности:\n"
            "• Проверка ESLint правил\n"
            "• Анализ производительности\n"
            "• Поиск неиспользуемого кода\n"
            "• Рекомендации по оптимизации"
        )
    
    def show_build_manager(self):
        """Показать менеджер сборки (заглушка)"""
        messagebox.showinfo(
            "Build Manager", 
            "🚧 Инструмент планируется\n\n"
            "Планируемые возможности:\n"
            "• Автоматическая сборка проекта\n"
            "• Деплой на сервер\n"
            "• Управление версиями\n"
            "• Docker контейнеризация"
        )
    
    # ======================================
    # УТИЛИТЫ
    # ======================================
    
    def open_project_folder(self):
        """Открытие папки проекта"""
        try:
            project_path = self.find_project_root()
            if project_path:
                if sys.platform == "win32":
                    os.startfile(project_path)
                elif sys.platform == "darwin":
                    subprocess.run(["open", project_path])
                else:
                    subprocess.run(["xdg-open", project_path])
                
                self.update_status(f"📁 Открыта папка: {project_path}", self.colors['success'])
            else:
                messagebox.showwarning("Предупреждение", "Не удалось найти корень проекта")
        
        except Exception as e:
            messagebox.showerror("Ошибка", f"Не удалось открыть папку проекта:\n{str(e)}")
    
    def start_dev_server(self):
        """Запуск dev сервера"""
        try:
            project_root = self.find_project_root()
            if project_root:
                # Ищем package.json для npm start
                package_json = Path(project_root) / "package.json"
                if package_json.exists():
                    self.update_status("🌐 Запуск React dev сервера...", self.colors['warning'])
                    
                    # Запускаем npm start в отдельном терминале
                    if sys.platform == "win32":
                        subprocess.Popen(f'start cmd /k "cd /d {project_root} && npm start"', shell=True)
                    else:
                        subprocess.Popen(['gnome-terminal', '--', 'bash', '-c', f'cd {project_root} && npm start; exec bash'])
                    
                    self.update_status("✅ Dev сервер запущен", self.colors['success'])
                else:
                    messagebox.showwarning("Предупреждение", "package.json не найден в корне проекта")
            else:
                messagebox.showwarning("Предупреждение", "Не удалось найти корень проекта")
        
        except Exception as e:
            messagebox.showerror("Ошибка", f"Не удалось запустить сервер:\n{str(e)}")
    
    def show_system_info(self):
        """Показать системную информацию"""
        import platform
        
        info = f"""
🖥 Системная информация

Операционная система: {platform.system()} {platform.release()}
Архитектура: {platform.machine()}
Процессор: {platform.processor()}
Python версия: {sys.version.split()[0]}
Рабочая директория: {os.getcwd()}

📂 Проект: {self.get_project_name()}
📁 Путь к проекту: {self.find_project_root() or 'Не найден'}

🛠 Доступные инструменты:
• CSS Text Editor: {'✅ Доступен' if self.check_css_editor() else '❌ Не найден'}
• Node.js: {'✅ Установлен' if self.check_nodejs() else '❌ Не найден'}
• Git: {'✅ Установлен' if self.check_git() else '❌ Не найден'}
        """
        
        messagebox.showinfo("Системная информация", info.strip())
    
    def open_settings(self):
        """Открыть настройки"""
        SettingsWindow(self)
    
    def show_help(self):
        """Показать справку"""
        help_text = """
🚀 Development Toolkit - Справка

ОСНОВНЫЕ ИНСТРУМЕНТЫ:
🎨 CSS Text Editor - Визуальный редактор CSS переменных
   Позволяет изменять стили приложения через удобный интерфейс

📱 Component Generator - Генератор React компонентов (в разработке)
   Создание новых компонентов с корпоративными стилями

🔍 Code Analyzer - Анализатор кода (планируется)
   Проверка качества и соответствия стандартам кода

📦 Build Manager - Менеджер сборки (планируется)
   Автоматизация процессов сборки и деплоя

БЫСТРЫЕ УТИЛИТЫ:
📁 Открыть проект - Открывает папку проекта в файловом менеджере
🌐 Запустить сервер - Запускает React dev сервер (npm start)
📋 Системная информация - Показывает информацию о системе
⚙️ Настройки - Настройки приложения
❓ Справка - Эта справка

ГОРЯЧИЕ КЛАВИШИ:
Ctrl+1 - CSS Text Editor
Ctrl+O - Открыть проект
Ctrl+S - Запустить сервер
F1 - Справка
        """
        
        messagebox.showinfo("Справка", help_text.strip())
    
    # ======================================
    # ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    # ======================================
    
    def run_tool(self, tool_path, tool_name):
        """Запуск инструмента в отдельном процессе"""
        try:
            if sys.platform == "win32":
                # Для Windows используем отдельный процесс
                subprocess.Popen([sys.executable, tool_path])
            else:
                subprocess.run([sys.executable, tool_path], check=True)
        except subprocess.CalledProcessError as e:
            error_msg = f"Не удалось запустить {tool_name}:\n{str(e)}"
            self.root.after(0, lambda msg=error_msg: messagebox.showerror("Ошибка запуска", msg))
        except Exception as e:
            error_msg = f"Неожиданная ошибка при запуске {tool_name}:\n{str(e)}"
            self.root.after(0, lambda msg=error_msg: messagebox.showerror("Ошибка", msg))
    
    def show_tool_not_found(self, tool_name, filename):
        """Показать сообщение о том, что инструмент не найден"""
        messagebox.showerror(
            "Инструмент не найден",
            f"Не найден файл {filename}\n\n"
            f"Убедитесь, что файл {tool_name} находится в той же папке, "
            f"что и эта программа.\n\n"
            f"Ожидаемый путь: {Path(__file__).parent / filename}"
        )
    
    def find_project_root(self):
        """Поиск корня проекта (папка с package.json или src/)"""
        current = Path.cwd()
        
        # Ищем в текущей директории и выше
        for path in [current] + list(current.parents):
            if (path / "package.json").exists() or (path / "src").exists():
                return str(path)
        
        return None
    
    def get_project_name(self):
        """Получение имени проекта"""
        project_root = self.find_project_root()
        if project_root:
            # Пытаемся получить имя из package.json
            package_json = Path(project_root) / "package.json"
            if package_json.exists():
                try:
                    with open(package_json, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        return data.get('name', Path(project_root).name)
                except:
                    pass
            
            return Path(project_root).name
        
        return "Неизвестный проект"
    
    def check_tools_availability(self):
        """Проверка доступности инструментов"""
        # Можно добавить проверки и обновить UI соответственно
        pass
    
    def check_css_editor(self):
        """Проверка наличия CSS редактора"""
        css_web = Path(__file__).parent / "text_css_editor.py"
        css_desktop = Path(__file__).parent / "css_editor.py"
        return css_web.exists() or css_desktop.exists()
    
    def check_nodejs(self):
        """Проверка установки Node.js"""
        try:
            subprocess.run(['node', '--version'], capture_output=True, check=True)
            return True
        except:
            return False
    
    def check_git(self):
        """Проверка установки Git"""
        try:
            subprocess.run(['git', '--version'], capture_output=True, check=True)
            return True
        except:
            return False
    
    def load_settings(self):
        """Загрузка настроек"""
        # Здесь можно загрузить настройки из файла
        pass
    
    def save_settings(self):
        """Сохранение настроек"""
        # Здесь можно сохранить настройки в файл
        pass
    
    def setup_hotkeys(self):
        """Настройка горячих клавиш"""
        self.root.bind('<Control-1>', lambda e: self.open_css_editor())
        self.root.bind('<Control-o>', lambda e: self.open_project_folder())
        self.root.bind('<Control-s>', lambda e: self.start_dev_server())
        self.root.bind('<F1>', lambda e: self.show_help())
    
    def run(self):
        """Запуск приложения"""
        self.setup_hotkeys()
        self.root.mainloop()


class SettingsWindow:
    """Окно настроек"""
    
    def __init__(self, parent):
        self.parent = parent
        self.window = tk.Toplevel(parent.root)
        self.window.title("⚙️ Настройки")
        self.window.geometry("500x400")
        self.window.transient(parent.root)
        self.window.grab_set()
        
        self.create_interface()
    
    def create_interface(self):
        """Создание интерфейса настроек"""
        
        # Заголовок
        title_label = tk.Label(
            self.window,
            text="⚙️ Настройки Development Toolkit",
            font=('Segoe UI', 16, 'bold'),
            fg=self.parent.colors['text_primary'],
            bg=self.parent.colors['background']
        )
        title_label.pack(pady=20)
        
        # Notebook для вкладок
        notebook = ttk.Notebook(self.window)
        notebook.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Вкладка "Общие"
        general_frame = ttk.Frame(notebook)
        notebook.add(general_frame, text="Общие")
        
        # Настройки темы
        theme_label = tk.Label(general_frame, text="Тема приложения:", font=('Segoe UI', 12))
        theme_label.pack(anchor='w', pady=(10, 5))
        
        theme_var = tk.StringVar(value="Корпоративная")
        theme_combo = ttk.Combobox(general_frame, textvariable=theme_var, values=["Корпоративная", "Темная", "Светлая"])
        theme_combo.pack(anchor='w', pady=(0, 10))
        
        # Автозапуск
        autostart_var = tk.BooleanVar()
        autostart_check = tk.Checkbutton(
            general_frame,
            text="Автоматически запускать при старте системы",
            variable=autostart_var,
            font=('Segoe UI', 11)
        )
        autostart_check.pack(anchor='w', pady=5)
        
        # Вкладка "Инструменты"
        tools_frame = ttk.Frame(notebook)
        notebook.add(tools_frame, text="Инструменты")
        
        tools_info = tk.Label(
            tools_frame,
            text="Настройки инструментов будут добавлены\nв следующих версиях",
            font=('Segoe UI', 12),
            justify=tk.CENTER
        )
        tools_info.pack(expand=True)
        
        # Кнопки
        buttons_frame = tk.Frame(self.window, bg=self.parent.colors['background'])
        buttons_frame.pack(fill=tk.X, padx=20, pady=10)
        
        save_btn = ttk.Button(
            buttons_frame,
            text="Сохранить",
            style='Primary.TButton',
            command=self.save_settings
        )
        save_btn.pack(side=tk.RIGHT, padx=(5, 0))
        
        cancel_btn = ttk.Button(
            buttons_frame,
            text="Отмена",
            style='Secondary.TButton',
            command=self.window.destroy
        )
        cancel_btn.pack(side=tk.RIGHT)
    
    def save_settings(self):
        """Сохранение настроек"""
        messagebox.showinfo("Настройки", "Настройки сохранены!")
        self.window.destroy()


def safe_print(message):
    """Безопасный вывод с обработкой кодировки"""
    try:
        print(message)
    except UnicodeEncodeError:
        # Убираем эмодзи для Windows консоли
        clean_message = message.encode('ascii', 'ignore').decode('ascii')
        print(clean_message)

if __name__ == "__main__":
    # Запуск приложения
    try:
        safe_print("Запуск Development Toolkit...")
        app = DevelopmentToolkit()
        safe_print("Интерфейс готов")
        app.run()
    except ImportError as e:
        safe_print(f"Ошибка импорта: {e}")
        safe_print("Убедитесь, что установлены все необходимые библиотеки")
        input("Нажмите Enter для выхода...")
        sys.exit(1)
    except Exception as e:
        safe_print(f"Критическая ошибка: {e}")
        try:
            messagebox.showerror("Критическая ошибка", f"Не удалось запустить приложение:\n{str(e)}")
        except:
            safe_print("Не удалось показать диалог ошибки")
        input("Нажмите Enter для выхода...")
        sys.exit(1)