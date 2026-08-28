-- Data API가 새로 노출한 core/analytics 스키마를 즉시 다시 읽도록 합니다.
notify pgrst, 'reload schema';
