from django.urls import path
from . import views

urlpatterns = [
    path(
        "datasets/",
        views.DatasetListCreateView.as_view(),
        name="dataset-list",
    ),
    path(
        "datasets/sample/csv/",
        views.download_sample_csv,
        name="dataset-sample-csv",
    ),
    path(
        "datasets/sample/xlsx/",
        views.download_sample_xlsx,
        name="dataset-sample-xlsx",
    ),
    path(
        "datasets/<int:pk>/",
        views.DatasetDetailView.as_view(),
        name="dataset-detail",
    ),
    path(
        "datasets/manual/",
        views.DatasetManualCreateView.as_view(),
        name="dataset-manual",
    ),
    path(
        "datasets/random/",
        views.DatasetRandomView.as_view(),
        name="dataset-random",
    ),
    path(
        "datasets/upload/",
        views.DatasetUploadView.as_view(),
        name="dataset-upload",
    ),
]