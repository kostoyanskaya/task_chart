from rest_framework import serializers
from .models import Dataset, Series, DataPoint, SeriesType


class DataPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataPoint
        fields = ["date", "value"]

    def validate_value(self, value):
        if not isinstance(value, (int, float)):
            raise serializers.ValidationError(
                "Значение должно быть числом."
            )
        if value in (float("inf"), float("-inf")):
            raise serializers.ValidationError(
                "Значение не может быть бесконечностью."
            )
        return value

    def validate_date(self, value):
        if value is None:
            raise serializers.ValidationError("Дата обязательна.")
        return value


class SeriesSerializer(serializers.ModelSerializer):
    points = DataPointSerializer(many=True)

    class Meta:
        model = Series
        fields = ["id", "name", "type", "color", "unit", "order", "points"]


class SeriesInputSerializer(serializers.Serializer):
    """Используется при создании датасета вручную через JSON."""

    name = serializers.CharField(max_length=255)
    type = serializers.ChoiceField(choices=SeriesType.choices)
    color = serializers.CharField(
        max_length=7, required=False, allow_blank=True
    )
    unit = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    points = DataPointSerializer(many=True)


class DatasetCreateSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=255, required=False, default="Untitled dataset"
    )
    series = SeriesInputSerializer(many=True)

    def validate_name(self, value):
        if value and len(value) > 255:
            raise serializers.ValidationError(
                "Название датасета слишком длинное."
            )
        return value or "Untitled dataset"

    def validate_series(self, value):
        if not (1 <= len(value) <= 4):
            raise serializers.ValidationError(
                "Датасет должен содержать от 1 до 4 серий."
            )
        names = [s["name"] for s in value]
        if len(names) != len(set(names)):
            raise serializers.ValidationError(
                "Названия серий не должны повторяться."
            )
        return value

    def create(self, validated_data):
        dataset = Dataset.objects.create(
            name=validated_data.get("name") or "Untitled dataset",
            source="manual",
        )
        for idx, series_data in enumerate(validated_data["series"]):
            points = series_data.pop("points")
            series = Series.objects.create(
                dataset=dataset, order=idx, **series_data
            )
            DataPoint.objects.bulk_create(
                [DataPoint(series=series, **p) for p in points]
            )
        return dataset


class DatasetSerializer(serializers.ModelSerializer):
    series = SeriesSerializer(many=True, read_only=True)

    class Meta:
        model = Dataset
        fields = ["id", "name", "source", "created_at", "updated_at", "series"]


class DatasetListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ["id", "name", "source", "created_at", "updated_at"]
