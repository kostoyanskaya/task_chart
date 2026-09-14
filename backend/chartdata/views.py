from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.http import FileResponse, Http404

from .models import Dataset
from .serializers import (
    DatasetSerializer,
    DatasetListSerializer,
    DatasetCreateSerializer,
)
from .utils import generate_random_dataset, parse_tabular_file
import os


SAMPLES_DIR = os.path.join(settings.BASE_DIR, "samples")


class DatasetListCreateView(generics.ListAPIView):
    """GET /api/datasets/ - list saved datasets (most recent first)."""

    queryset = Dataset.objects.all()
    serializer_class = DatasetListSerializer


class DatasetDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/datasets/<id>/"""

    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    lookup_url_kwarg = "pk"


class DatasetManualCreateView(APIView):
    """POST /api/datasets/manual/ - create a dataset from manually
    entered data."""

    def post(self, request):
        serializer = DatasetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dataset = serializer.save()
        return Response(
            DatasetSerializer(dataset).data,
            status=status.HTTP_201_CREATED,
        )


class DatasetRandomView(APIView):
    """POST /api/datasets/random/ - generate & persist a random
    4-series dataset."""

    def post(self, request):
        days = int(request.data.get("days", 14))
        days = max(5, min(days, 90))
        payload = generate_random_dataset(days=days)
        serializer = DatasetCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        dataset = serializer.save()
        Dataset.objects.filter(pk=dataset.pk).update(source="random")
        dataset.refresh_from_db()
        return Response(
            DatasetSerializer(dataset).data,
            status=status.HTTP_201_CREATED,
        )


class DatasetUploadView(APIView):
    """POST /api/datasets/upload/ - multipart file upload
    (CSV or Excel)."""

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided under 'file' field."},
                status=400,
            )

        series_types_raw = request.data.get("series_types", "")
        series_types = [
            t.strip() for t in series_types_raw.split(",") if t.strip()
        ] or None

        try:
            payload = parse_tabular_file(
                file_obj, file_obj.name, series_types=series_types
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        serializer = DatasetCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        dataset = serializer.save()
        source = (
            "excel"
            if file_obj.name.lower().endswith((".xlsx", ".xls"))
            else "csv"
        )
        Dataset.objects.filter(pk=dataset.pk).update(source=source)
        dataset.refresh_from_db()
        return Response(
            DatasetSerializer(dataset).data,
            status=status.HTTP_201_CREATED,
        )


def _serve_sample(filename: str, content_type: str):
    path = os.path.join(SAMPLES_DIR, filename)
    if not os.path.isfile(path):
        raise Http404(f"Sample file '{filename}' not found.")
    return FileResponse(
        open(path, "rb"),
        as_attachment=True,
        filename=filename,
        content_type=content_type,
    )


def download_sample_csv(request):
    """GET /api/datasets/sample/csv/ — отдаёт готовый образец CSV."""
    return _serve_sample("sample_dataset.csv", "text/csv")


def download_sample_xlsx(request):
    """GET /api/datasets/sample/xlsx/ — отдаёт готовый образец
    Excel."""
    return _serve_sample(
        "sample_dataset.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )