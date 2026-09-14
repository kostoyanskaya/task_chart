from django.contrib import admin
from .models import Dataset, Series, DataPoint


class SeriesInline(admin.TabularInline):
    model = Series
    extra = 0


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "source", "created_at")
    inlines = [SeriesInline]


@admin.register(Series)
class SeriesAdmin(admin.ModelAdmin):
    list_display = ("id", "dataset", "name", "type", "color")


admin.site.register(DataPoint)