import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  this.heart.classList.toggle('heart__button--hearted');
  axios
    .post(this.action)
    .catch(console.error);
}

export default ajaxHeart;
