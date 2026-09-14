from django.db import models


class SeriesType(models.TextChoices):
    AREA = "area", "Area"
    SPLINE = "spline", "Spline"
    LINE = "line", "Line"
    BAR = "bar", "Bar"


DEFAULT_COLORS = {
    SeriesType.AREA: "#F2D675",
    SeriesType.SPLINE: "#3B82F6",
    SeriesType.LINE: "#22A559",
    SeriesType.BAR: "#B026FF",
}


class Dataset(models.Model):
    name = models.CharField(
        max_length=255, default="Untitled dataset"
    )
    source = models.CharField(
        max_length=20,
        choices=[
            ("manual", "Manual"),
            ("csv", "CSV"),
            ("excel", "Excel"),
            ("random", "Random"),
        ],
        default="manual",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.id})"

    class Meta:
        ordering = ["-created_at"]


class Series(models.Model):
    dataset = models.ForeignKey(
        Dataset, related_name="series", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=SeriesType.choices)
    color = models.CharField(max_length=7, blank=True)
    unit = models.CharField(max_length=20, blank=True, default="")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def save(self, *args, **kwargs):
        if not self.color:
            self.color = DEFAULT_COLORS.get(self.type, "#888888")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} [{self.type}]"


class DataPoint(models.Model):
    series = models.ForeignKey(
        Series, related_name="points", on_delete=models.CASCADE
    )
    date = models.DateField()
    value = models.FloatField()

    class Meta:
        ordering = ["date"]
        unique_together = ("series", "date")

    def __str__(self):
        return f"{self.date}: {self.value}"
