<?php

/*
|--------------------------------------------------------------------------
| Routes File
|--------------------------------------------------------------------------
|
| Here is where you will register all of the routes in an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/
use Illuminate\Http\Request;

Route::get('/', function () {
    return view('welcome');
});




/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| This route group applies the "web" middleware group to every route
| it contains. The "web" middleware group is defined in your HTTP
| kernel and includes session state, CSRF protection, and more.
|
*/

Route::group(['middleware' => ['web']], function () {
    //

    Route::get('/laravel', function (Request $request) {
        // 从 session 中获取数据...
        $value = $request->session()->get('viewCnt',0);
        $value = $value?($value+1):1;
        // 存储数据到 session...
        $request->session()->put('viewCnt', $value);

        return response()->json(['words'=>'你好,我是laravel后台,这是第'.$value.'次浏览']);
    });

    Route::get('/laravel2', function () {
        return redirect('/laravel');
    });
});
