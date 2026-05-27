import { mount } from 'svelte';
import DemoApp from './DemoApp.svelte';
import '../src/styles/gs-wallpaper.css';
import './demo.css';

mount(DemoApp, { target: document.getElementById('app')! });
