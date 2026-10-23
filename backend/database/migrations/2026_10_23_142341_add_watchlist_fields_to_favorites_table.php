<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Turns favorites into a watchlist: a status, the user's own rating, and a note.
     */
    public function up(): void
    {
        Schema::table('favorites', function (Blueprint $table) {
            $table->string('status', 20)->default('want_to_watch')->after('poster_path'); // want_to_watch | watched
            $table->unsignedTinyInteger('rating')->nullable()->after('status');            // 1 to 5 stars
            $table->text('note')->nullable()->after('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('favorites', function (Blueprint $table) {
            $table->dropColumn(['status', 'rating', 'note']);
        });
    }
};
