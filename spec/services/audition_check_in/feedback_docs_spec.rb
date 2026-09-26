# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditionCheckIn::FeedbackDocs do
  subject(:docs) { described_class.new(drive_api: drive_api, folder_id: 'folder', today: Date.new(2026, 10, 3)) }

  let(:drive_api) { class_double(External::GoogleDriveApi) }
  let(:html) { {} }

  before do
    allow(drive_api).to receive(:image_thumbnail).and_return(['jpeg-bytes', 'image/jpeg'])
    allow(drive_api).to receive(:replace_doc_with_html) { |doc_id, body| html[doc_id] = body }
  end

  def person(**overrides)
    AuditionCheckIn::Person.new(first_name: 'Sam', last_name: 'Reed', email: 'sam@example.com',
                                selfie: 'https://drive.google.com/open?id=photo1', pronouns: 'he/him',
                                birthday: '5/1/2009', **overrides)
  end

  it "puts a person's details, including their age today, above their photo" do
    docs.write({ 'SNARE' => 'doc' }, { 'SNARE' => [person] })

    details = ['<b>Pronouns:</b> he/him', '<b>Age:</b> 17', '<b>Birthday:</b> 5/1/2009',
               '<b>Email:</b> sam@example.com']
    positions = [*details, '<img src="data:image/jpeg;base64,'].map { |fragment| html['doc'].index(fragment) }
    expect(positions).to all(be_present)
    expect(positions).to eq(positions.sort)
    expect(html['doc']).to include(%(width="#{described_class::PHOTO_WIDTH}"))
  end

  it 'asks Drive for a downscaled copy of the selfie, not the original' do
    docs.write({ 'SNARE' => 'doc' }, { 'SNARE' => [person] })

    expect(drive_api).to have_received(:image_thumbnail).with('photo1', size: described_class::THUMBNAIL_SIZE)
  end

  it "says so when there's no photo Drive can open, and counts it" do
    allow(drive_api).to receive(:image_thumbnail).and_return(nil)

    result = docs.write({ 'SNARE' => 'doc' }, { 'SNARE' => [person, person(selfie: 'typed text, not an upload')] })

    expect(html['doc'].scan('No selfie').size).to eq(2)
    expect(result).to eq([0, 2])
  end

  it 'escapes what people typed into the public form' do
    docs.write({ 'SNARE' => 'doc' }, { 'SNARE' => [person(first_name: '<script>x</script>')] })

    expect(html['doc']).not_to include('<script>')
    expect(html['doc']).to include('&lt;script&gt;')
  end

  describe '#find' do
    it 'finds the Visual Ensemble doc by its own name, ignoring case and spacing' do
      allow(drive_api).to receive(:docs_in_folder).and_return('Snare ' => 'snare-doc', 'Visual Ensemble' => 've-doc')

      expect(docs.find(%w[SNARE VE])).to eq('SNARE' => 'snare-doc', 'VE' => 've-doc')
    end
  end
end
