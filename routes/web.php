<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('search'));
Route::get('/{any?}', fn () => view('search'))->where('any', '.*');