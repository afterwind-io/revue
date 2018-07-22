import { Revue } from '../src/revue';
import { Prop } from '../src/decorators';
import { createElement as h } from '../src/element';
import {
  h1,
  h3,
  p,
  input,
  div,
  button,
} from '../src/element.util';

import { ITodo } from './test.type';
import Todo from './todo';

const TODOS: ITodo[] = [
  { work: 'Read a book', isImportant: true },
  { work: 'Write code', isImportant: true },
  { work: 'Watch a movie', isImportant: false },
];

export default class App extends Revue {
  @Prop
  private name: string = 'Doge';
  @Prop
  private isHappy: boolean = true;
  @Prop
  private todos: ITodo[] = TODOS;
  @Prop
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
    // this.todos.splice(index, 1);
    this.todos = [...this.todos.splice(index, 1)];
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

  private onTodoChanged(todo: ITodo, isImportant: boolean) {
    todo.isImportant = isImportant;
  }

  private renderHeader() {
    return () => [
      h(() => this.isHappy ? 'h1' : 'h3', null, () => this.title),
      p(null,
        'Your name: ',
        input(() => ({
          domAttr: {
            value: this.name,
          },
          on: {
            input: (e: KeyboardEvent) => this.onNameChanged(e),
          },
        })),
      ),
      p(null,
        input(() => ({
          domAttr: {
            type: 'checkbox',
            checked: this.isHappy,
          },
          on: {
            input: (e: KeyboardEvent) => this.onHappyChanged(e),
          },
        })),
        'I feel happy now.',
      ),
    ];
  }

  private renderTodos() {
    return [
      h3(null, 'My Todos'),
      input(() => ({
        domAttr: {
          value: this.todoCache,
        },
        on: {
          input: (e: KeyboardEvent) => this.onTodoCacheChanged(e),
        },
      })),
      button(
        () => ({
          on: {
            click: () => this.add(),
          },
        }),
        'Add',
      ),
      this.todos.map((todo, index) =>
        // h(Todo, () => ({
        //   data: todo,
        //   changed: (t: ITodo, isImportant: boolean) => this.onTodoChanged(t, isImportant),
        // })),
        p(null,
          button(
            () => ({
              on: {
                click: () => this.remove(index),
              },
            }),
            'Remove',
          ),
          todo.work,
        ),
      ),
    ];
  }

  public render() {
    const e = div(null,
      this.renderHeader(),
      this.renderTodos(),
    );
    console.log(e);
    return e;
  }
}
