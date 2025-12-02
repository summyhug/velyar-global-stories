Pod::Spec.new do |s|
  s.name = 'StoryCamera'
  s.version = '1.0.0'
  s.summary = 'StoryCamera Capacitor Plugin'
  s.license = 'MIT'
  s.homepage = 'https://github.com/ionic-team/capacitor'
  s.author = 'Ionic Team'
  s.source = { :git => '' }
  s.source_files = 'ios/StoryCameraPlugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '13.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
