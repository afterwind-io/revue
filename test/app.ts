import { Revue } from '../src/revue';
import { Observable } from '../src/decorators';
import { createElement as h } from '../src/element';
import {
  h1,
  h3,
  p,
  input,
  div,
  button,
  text,
} from '../src/element.util';

import { ITodo } from './test.type';
import Todo from './todo';

const TODOS: ITodo[] = [
  { work: 'Read a book', isImportant: true },
  { work: 'Write code', isImportant: true },
  { work: 'Watch a movie', isImportant: false },
];

export default class App extends Revue {
  @Observable
  private name: string = 'Doge';
  @Observable
  private isHappy: boolean = true;
  @Observable
  private todos: ITodo[] = TODOS;
  @Observable
  private todoCache: string = '';

  private greeting: string = 'Hello World';

  private get title(): string {
    return `${this.greeting}, ${this.name}!`;
  }

  private add() {
    const todo: ITodo = {
      work: this.todoCache,
      isImportant: false,
    };

    this.todos.push(todo);
    this.todoCache = '';
  }

  private remove(index: number) {
    this.todos.splice(index, 1);
  }

  private onNameChanged(e: KeyboardEvent) {
    this.name = (e.target as HTMLInputElement).value;
  }

  private onHappyChanged(e: KeyboardEvent) {
    this.isHappy = (e.target as HTMLInputElement).checked;
  }

  private onTodoCacheChanged(e: KeyboardEvent) {
    this.todoCache = (e.target as HTMLInputElement).value;
  }

  private onWorkChanged(todo: ITodo, e: KeyboardEvent) {
    todo.work = (e.target as HTMLInputElement).value;
  }

  private onImportanceChanged(todo: ITodo, isImportant: boolean) {
    todo.isImportant = isImportant;
  }

  private renderHeader() {
    return [
      h(() => this.isHappy ? 'h1' : 'h3', null, text(() => this.title)),
      p(null,
        'Your name: ',
        input(() => ({
          value: this.name,
          oninput: (e: KeyboardEvent) => this.onNameChanged(e),
        })),
      ),
      p(null,
        input(() => ({
          type: 'checkbox',
          checked: this.isHappy,
          oninput: (e: KeyboardEvent) => this.onHappyChanged(e),
        })),
        'I feel happy now.',
      ),
      () => this.todos.map((t, index) => p(null,
        input(() => ({
          value: t.work,
          oninput: (e: KeyboardEvent) => this.onWorkChanged(t, e),
        })),
        button(
          () => ({
            onclick: () => this.remove(index),
          }),
          'remove',
        ),
      )),
    ];
  }

  private renderTodos() {
    return [
      h3(null, 'My Todos'),
      input(() => ({
        value: this.todoCache,
        oninput: (e: KeyboardEvent) => this.onTodoCacheChanged(e),
      })),
      button(
        () => ({
          onclick: () => this.add(),
        }),
        'Add',
      ),
      () => this.todos.map((todo, index) =>
        p(null,
          button(
            () => ({
              onclick: () => this.remove(index),
            }),
            'Remove',
          ),
          h(Todo, () => ({
            data: () => this.isHappy ? todo : { work: '_(:з」∠)_', isImportant: false },
            isHappy: () => this.isHappy,
            changed: (t: ITodo, isImportant: boolean) => this.onImportanceChanged(t, isImportant),
          })),
        ),
      ),
    ];
  }

  public render() {
    return div(null,
      this.renderHeader(),
      this.renderTodos(),
    );
  }
}
